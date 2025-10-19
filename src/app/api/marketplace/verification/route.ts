import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      campaignId,
      submitterId,
      verificationType,
      verificationLevel,
      documents,
      autoAnalysis
    } = body

    // Validate required fields
    if (!submitterId || !verificationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create verification request
    const verification = await db.marketplaceVerification.create({
      data: {
        projectId: projectId || null,
        campaignId: campaignId || null,
        submitterId,
        verificationType,
        status: 'pending',
        priority: 'normal',
        verificationLevel: verificationLevel || 'basic',
        autoApproved: false,
        manualReview: true,
        documents: documents ? JSON.parse(documents) : null
      }
    })

    // Start AI analysis if auto-analysis is enabled
    if (autoAnalysis && verificationType === 'smart_contract') {
      // Trigger smart contract analysis in background
      analyzeSmartContract(verification.id, projectId, campaignId)
    }

    // If it's a project verification, start project analysis
    if (verificationType === 'project' && projectId) {
      analyzeProject(verification.id, projectId)
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        submittedAt: verification.submittedAt
      }
    })
  } catch (error) {
    console.error('Error creating verification request:', error)
    return NextResponse.json(
      { error: 'Failed to create verification request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submitterId = searchParams.get('submitterId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (submitterId) where.submitterId = submitterId
    if (status) where.status = status
    if (type) where.verificationType = type

    const verifications = await db.marketplaceVerification.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error('Error fetching verifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    )
  }
}

async function analyzeSmartContract(verificationId: string, projectId?: string, campaignId?: string) {
  try {
    const zai = await ZAI.create()

    // Get project or campaign details for contract address
    let contractAddress = null
    let blockchain = null

    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId }
      })
      if (project) {
        contractAddress = project.contractAddress
        blockchain = project.blockchain
      }
    }

    if (!contractAddress) {
      await db.marketplaceVerification.update({
        where: { id: verificationId },
        data: {
          status: 'rejected',
          rejectionReason: 'No contract address found for analysis'
        }
      })
      return
    }

    // Perform AI-powered smart contract analysis
    const analysisPrompt = `
    Analyze this smart contract for security vulnerabilities and risks:
    
    Contract Address: ${contractAddress}
    Blockchain: ${blockchain}
    
    Please analyze for:
    1. Common security vulnerabilities (reentrancy, overflow, etc.)
    2. Rug pull potential
    3. Tokenomics sustainability
    4. Code quality and best practices
    5. Overall risk assessment
    
    Provide a risk score (0-100) and detailed findings.
    `

    const analysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert smart contract security auditor. Provide detailed, technical analysis.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })

    const analysisResult = analysis.choices[0]?.message?.content

    // Create smart contract analysis record
    await db.smartContractAnalysis.create({
      data: {
        contractAddress,
        blockchain,
        projectId: projectId || null,
        campaignId: campaignId || null,
        analysisType: 'security',
        status: 'completed',
        riskScore: 50, // Default, would be extracted from AI analysis
        analysisResult: analysisResult ? JSON.stringify({ content: analysisResult }) : null,
        autoAnalysis: true,
        isVerified: false,
        lastAnalyzed: new Date()
      }
    })

    // Update verification status
    await db.marketplaceVerification.update({
      where: { id: verificationId },
      data: {
        status: 'under_review',
        verificationData: analysisResult ? JSON.stringify({ content: analysisResult }) : null,
        reviewedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error in smart contract analysis:', error)
    await db.marketplaceVerification.update({
      where: { id: verificationId },
      data: {
        status: 'rejected',
        rejectionReason: 'Analysis failed: ' + error.message
      }
    })
  }
}

async function analyzeProject(verificationId: string, projectId: string) {
  try {
    const zai = await ZAI.create()

    // Get project details
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      await db.marketplaceVerification.update({
        where: { id: verificationId },
        data: {
          status: 'rejected',
          rejectionReason: 'Project not found'
        }
      })
      return
    }

    // Perform AI-powered project analysis
    const analysisPrompt = `
    Analyze this Web3 project for legitimacy and potential:
    
    Project Name: ${project.name}
    Website: ${project.website}
    Description: ${project.description}
    Category: ${project.category}
    Blockchain: ${project.blockchain}
    
    Please analyze:
    1. Team credibility and experience
    2. Project concept and viability
    3. Market potential and competition
    4. Technical implementation quality
    5. Community engagement and social presence
    6. Overall trustworthiness
    
    Provide a risk score (0-100) and detailed assessment.
    `

    const analysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Web3 project analyst. Provide thorough, objective analysis.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })

    const analysisResult = analysis.choices[0]?.message?.content

    // Update verification with analysis results
    await db.marketplaceVerification.update({
      where: { id: verificationId },
      data: {
        status: 'under_review',
        verificationData: analysisResult ? JSON.stringify({ content: analysisResult }) : null,
        riskScore: 50, // Default, would be extracted from AI analysis
        reviewedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error in project analysis:', error)
    await db.marketplaceVerification.update({
      where: { id: verificationId },
      data: {
        status: 'rejected',
        rejectionReason: 'Analysis failed: ' + error.message
      }
    })
  }
}