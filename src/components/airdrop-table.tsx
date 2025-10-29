"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ExternalLink, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAirdrops, type Airdrop } from "@/hooks/api/use-airdrops"

interface AirdropTableProps {
  searchQuery?: string
  category?: string
  status?: string
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "interested":
      return <Badge variant="secondary">Interested</Badge>
    case "in_progress":
      return <Badge variant="outline">In Progress</Badge>
    case "completed":
      return <Badge className="bg-green-500 text-white">Completed</Badge>
    default:
      return <Badge variant="outline">Not Started</Badge>
  }
}

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    defi: "bg-blue-500",
    layer2: "bg-purple-500",
    gaming: "bg-green-500",
    nft: "bg-pink-500",
    infrastructure: "bg-orange-500",
  }

  return (
    <Badge 
      variant="secondary" 
      className={`${colors[category] || 'bg-gray-500'} text-white`}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  )
}

export function AirdropTable({ searchQuery = "", category = "all", status = "all" }: AirdropTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const { data, isLoading, error } = useAirdrops({
    search: searchQuery || undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
  })

  const columns: ColumnDef<Airdrop>[] = [
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => {
        const airdrop = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={airdrop.logoUrl || ""} />
              <AvatarFallback>
                {airdrop.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-primary">{airdrop.name}</div>
              <div className="text-sm text-muted-foreground">
                {getCategoryBadge(airdrop.category)}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "riskScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Risk Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.getValue("riskScore") as number
        return <ScoreBadge score={score} type="risk" />
      },
    },
    {
      accessorKey: "hypeScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Hype Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.getValue("hypeScore") as number
        return <ScoreBadge score={score} type="hype" />
      },
    },
    {
      accessorKey: "userStatus",
      header: "Status",
      cell: ({ row }) => {
        const userStatus = row.original.userStatus
        return getStatusBadge(userStatus)
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const airdrop = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/airdrops/${airdrop.slug}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View Tasks
              </Button>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <a
                href={airdrop.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: data?.airdrops || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load airdrops</p>
        <p className="text-muted-foreground text-sm mt-2">
          Please try again later
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data?.total || 0} airdrops found
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-surface-hover"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No airdrops found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}