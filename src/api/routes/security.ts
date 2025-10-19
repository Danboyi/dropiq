import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requirePermission, optionalAuth } from '@/middleware/auth';
import { generalRateLimiter, sensitiveOperationRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ZAI } from 'z-ai-web-dev-sdk';
import { ScamReportStatus, ScamSeverity, SecurityAlertType, ScamType } from '@prisma/client';

const router = Router();

// Validation schemas
const createScamReportSchema = {
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.nativeEnum(ScamType),
    severity: z.nativeEnum(ScamSeverity),
    targetUrl: z.string().url().optional(),
    targetAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional(),
    targetProject: z.string().optional(),
    evidence: z.array(z.string().url()).optional(),
    additionalInfo: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional()
  })
};

const updateScamReportSchema = {
  body: z.object({
    status: z.nativeEnum(ScamReportStatus).optional(),
    severity: z.nativeEnum(ScamSeverity).optional(),
    moderatorNotes: z.string().max(2000).optional(),
    tags: z.array(z.string()).optional()
  })
};

const scamQuerySchema = {
  query: z.object({
    status: z.nativeEnum(ScamReportStatus).optional(),
    type: z.nativeEnum(ScamType).optional(),
    severity: z.nativeEnum(ScamSeverity).optional(),
    search: z.string().optional(),
    verified: z.string().transform(val => val === 'true').optional(),
    resolved: z.string().transform(val => val === 'true').optional(),
    reporterId: z.string().uuid().optional()
  }).merge(commonSchemas.pagination.query)
};

// Get all scam reports (public - verified only)
router.get('/',
  optionalAuth,
  validateRequest(scamQuerySchema),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const {
      status,
      type,
      severity,
      search,
      verified,
      resolved,
      reporterId,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const userId = req.user?.id;
    const isModerator = req.user?.permissions?.includes('moderate:content');

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    // Non-moderators can only see verified reports
    if (!isModerator) {
      where.verified = true;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (verified !== undefined) where.verified = verified;
    if (resolved !== undefined) {
      where.status = resolved ? ScamReportStatus.RESOLVED : { not: ScamReportStatus.RESOLVED };
    }
    if (reporterId && isModerator) where.reporterId = reporterId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { targetProject: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'severity') {
      orderBy.severity = sortOrder;
    } else if (sortBy === 'reports') {
      orderBy.reportCount = sortOrder;
    } else if (sortBy === 'verifiedAt') {
      orderBy.verifiedAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [scamReports, total] = await Promise.all([
      db.scamReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true
            }
          },
          verifier: isModerator ? {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          } : false,
          relatedAirdrops: {
            select: {
              id: true,
              title: true,
              project: {
                select: {
                  name: true,
                  logo: true
                }
              }
            }
          },
          _count: {
            select: {
              confirmations: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.scamReport.count({ where })
    ]);

    // Add user confirmation status if authenticated
    let reportsWithUserStatus = scamReports;
    if (userId) {
      const userConfirmations = await db.scamConfirmation.findMany({
        where: {
          userId,
          reportId: { in: scamReports.map(r => r.id) }
        },
        select: {
          reportId: true,
          confirmed: true,
          confirmedAt: true
        }
      });

      const confirmationMap = userConfirmations.reduce((acc, c) => {
        acc[c.reportId] = c;
        return acc;
      }, {} as Record<string, any>);

      reportsWithUserStatus = scamReports.map(report => ({
        ...report,
        userConfirmation: confirmationMap[report.id] || null
      }));
    }

    res.json({
      reports: reportsWithUserStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get scam report by ID
router.get('/:id',
  optionalAuth,
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const isModerator = req.user?.permissions?.includes('moderate:content');

    const report = await db.scamReport.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            reputation: true
          }
        },
        verifier: isModerator ? {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        } : false,
        confirmations: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                reputation: true
              }
            }
          },
          orderBy: {
            confirmedAt: 'desc'
          },
          take: 20
        },
        relatedAirdrops: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                logo: true,
                chain: true,
                isVerified: true
              }
            }
          }
        },
        securityAlerts: isModerator ? {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        } : false,
        _count: {
          select: {
            confirmations: true,
            securityAlerts: isModerator ? true : false
          }
        }
      }
    });

    if (!report) {
      throw new NotFoundError('Scam report not found');
    }

    // Check if user can view this report
    if (!isModerator && !report.verified) {
      throw new NotFoundError('Scam report not found');
    }

    // Add user confirmation status if authenticated
    let userConfirmation = null;
    if (userId) {
      userConfirmation = await db.scamConfirmation.findUnique({
        where: {
          userId_reportId: {
            userId,
            reportId: id
          }
        },
        select: {
          id: true,
          confirmed: true,
          confirmedAt: true,
          additionalInfo: true
        }
      });
    }

    res.json({
      report: {
        ...report,
        userConfirmation
      }
    });
  })
);

// Create new scam report
router.post('/',
  authenticateToken,
  requirePermission('report:scam'),
  validateRequest(createScamReportSchema),
  sensitiveOperationRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const reportData = req.body;
    const userId = req.user.id;

    // Check for duplicate reports
    const existingReport = await db.scamReport.findFirst({
      where: {
        OR: [
          { targetUrl: reportData.targetUrl },
          { targetAddress: reportData.targetAddress },
          { targetProject: reportData.targetProject }
        ],
        status: { not: ScamReportStatus.RESOLVED },
        deletedAt: null
      }
    });

    if (existingReport) {
      throw new ConflictError('A similar scam report already exists');
    }

    // Create scam report
    const report = await db.scamReport.create({
      data: {
        ...reportData,
        reporterId: userId,
        status: ScamReportStatus.PENDING,
        verified: false,
        reportCount: 1
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // Auto-confirm by reporter
    await db.scamConfirmation.create({
      data: {
        userId,
        reportId: report.id,
        confirmed: true,
        confirmedAt: new Date()
      }
    });

    // Create security alert for high severity reports
    if (reportData.severity === ScamSeverity.CRITICAL || reportData.severity === ScamSeverity.HIGH) {
      await db.securityAlert.create({
        data: {
          type: SecurityAlertType.SCAM_DETECTED,
          title: `High Severity Scam Alert: ${reportData.title}`,
          description: reportData.description,
          severity: reportData.severity,
          relatedReportId: report.id,
          isActive: true
        }
      });
    }

    logger.warn('Scam report created', {
      reportId: report.id,
      reporterId: userId,
      type: reportData.type,
      severity: reportData.severity,
      target: reportData.targetUrl || reportData.targetAddress || reportData.targetProject
    });

    res.status(201).json({
      message: 'Scam report submitted successfully',
      report
    });
  })
);

// Confirm scam report
router.post('/:id/confirm',
  authenticateToken,
  requirePermission('report:scam'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: z.object({
      confirmed: z.boolean(),
      additionalInfo: z.string().max(1000).optional()
    })
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { confirmed, additionalInfo } = req.body;
    const userId = req.user.id;

    // Check if report exists and is verified
    const report = await db.scamReport.findUnique({
      where: {
        id,
        verified: true,
        deletedAt: null
      }
    });

    if (!report) {
      throw new NotFoundError('Scam report not found or not verified');
    }

    // Check if user already confirmed
    const existingConfirmation = await db.scamConfirmation.findUnique({
      where: {
        userId_reportId: {
          userId,
          reportId: id
        }
      }
    });

    if (existingConfirmation) {
      throw new ConflictError('You have already confirmed this report');
    }

    // Create confirmation
    const confirmation = await db.scamConfirmation.create({
      data: {
        userId,
        reportId: id,
        confirmed,
        additionalInfo,
        confirmedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            reputation: true
          }
        }
      }
    });

    // Update report confirmation count
    await db.scamReport.update({
      where: { id },
      data: {
        reportCount: {
          increment: confirmed ? 1 : 0
        }
      }
    });

    logger.info('Scam report confirmation', {
      reportId: id,
      userId,
      confirmed,
      ip: req.ip
    });

    res.status(201).json({
      message: `Report ${confirmed ? 'confirmed' : 'disputed'} successfully`,
      confirmation
    });
  })
);

// Analyze potential scam using AI
router.post('/analyze',
  authenticateToken,
  requirePermission('report:scam'),
  validateRequest({
    body: z.object({
      url: z.string().url().optional(),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional(),
      projectName: z.string().optional(),
      description: z.string().max(2000).optional()
    })
  }),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { url, address, projectName, description } = req.body;

    try {
      // Initialize ZAI SDK
      const zai = await ZAI.create();

      // Build analysis prompt
      const analysisPrompt = `
        Analyze this potential cryptocurrency scam:
        
        URL: ${url || 'N/A'}
        Address: ${address || 'N/A'}
        Project Name: ${projectName || 'N/A'}
        Description: ${description || 'N/A'}
        
        Please analyze for common scam indicators:
        1. Phishing attempts
        2. Fake giveaways
        3. Ponzi schemes
        4. Rug pull risks
        5. Social engineering tactics
        6. Technical red flags
        7. Team anonymity issues
        8. Unrealistic promises
        
        Provide a risk assessment and recommendations.
        
        Format the response as JSON:
        {
          "riskScore": number (0-100),
          "scamProbability": number (0-1),
          "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          "scamType": "PHISHING" | "FAKE_GIVEAWAY" | "PONZI" | "RUG_PULL" | "SOCIAL_ENGINEERING" | "OTHER",
          "indicators": [string],
          "recommendations": [string],
          "evidence": [string],
          "confidence": number (0-1)
        }
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency security expert specializing in scam detection. Provide detailed, accurate analysis in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');

      logger.info('Scam analysis completed', {
        userId: req.user.id,
        url,
        address,
        riskScore: analysisResult.riskScore,
        scamProbability: analysisResult.scamProbability
      });

      res.json({
        analysis: analysisResult,
        analyzedAt: new Date()
      });

    } catch (error) {
      logger.error('Scam analysis failed', {
        userId: req.user.id,
        url,
        address,
        error: error.message
      });

      throw new ValidationError('Failed to analyze potential scam. Please try again later.');
    }
  })
);

// Update scam report (moderator only)
router.put('/:id',
  authenticateToken,
  requirePermission('moderate:content'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: updateScamReportSchema.body
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { status, severity, moderatorNotes, tags } = req.body;
    const userId = req.user.id;

    // Check if report exists
    const report = await db.scamReport.findUnique({
      where: { id }
    });

    if (!report) {
      throw new NotFoundError('Scam report not found');
    }

    // Update report
    const updateData: any = {};
    if (status) updateData.status = status;
    if (severity) updateData.severity = severity;
    if (moderatorNotes) updateData.moderatorNotes = moderatorNotes;
    if (tags) updateData.tags = tags;

    // Verify report if status is being set to VERIFIED
    if (status === ScamReportStatus.VERIFIED && !report.verified) {
      updateData.verified = true;
      updateData.verifiedAt = new Date();
      updateData.verifierId = userId;

      // Create security alert
      await db.securityAlert.create({
        data: {
          type: SecurityAlertType.SCAM_DETECTED,
          title: `Verified Scam: ${report.title}`,
          description: report.description,
          severity: severity || report.severity,
          relatedReportId: id,
          isActive: true
        }
      });
    }

    const updatedReport = await db.scamReport.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        verifier: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    logger.info('Scam report updated', {
      reportId: id,
      moderatorId: userId,
      changes: updateData
    });

    res.json({
      message: 'Scam report updated successfully',
      report: updatedReport
    });
  })
);

// Get security alerts
router.get('/alerts',
  optionalAuth,
  validateRequest({
    query: z.object({
      type: z.nativeEnum(SecurityAlertType).optional(),
      active: z.string().transform(val => val === 'true').optional(),
      severity: z.nativeEnum(ScamSeverity).optional()
    }).merge(commonSchemas.pagination.query)
  }),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { type, active, severity, page, limit } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (active !== undefined) where.isActive = active;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      db.securityAlert.findMany({
        where,
        include: {
          relatedReport: {
            select: {
              id: true,
              title: true,
              type: true,
              severity: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.securityAlert.count({ where })
    ]);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get user's scam reports
router.get('/my/reports',
  authenticateToken,
  requirePermission('read:scam'),
  validateRequest(commonSchemas.pagination),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const [reports, total] = await Promise.all([
      db.scamReport.findMany({
        where: { reporterId: userId },
        include: {
          _count: {
            select: {
              confirmations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.scamReport.count({ where: { reporterId: userId } })
    ]);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

export default router;