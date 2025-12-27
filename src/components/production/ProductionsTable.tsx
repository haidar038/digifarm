import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Sprout } from "lucide-react";
import { Production } from "@/types/database";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProductionsTableProps {
  productions: Production[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (production: Production) => void;
  onHarvest: (production: Production) => void;
  onDelete: (production: Production) => void;
  loading?: boolean;
}

export function ProductionsTable({
  productions,
  selectedIds,
  onSelectionChange,
  onEdit,
  onHarvest,
  onDelete,
  loading,
}: ProductionsTableProps) {
  const statusStyles = {
    planted: "bg-secondary text-secondary-foreground",
    growing: "bg-primary/10 text-primary",
    harvested: "bg-primary/20 text-primary",
  };

  const toggleAll = () => {
    if (selectedIds.length === productions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(productions.map((p) => p.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (productions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No productions recorded yet</p>
        <p className="text-sm">Start by adding your first production</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === productions.length && productions.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="font-semibold">Commodity</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Land</TableHead>
            <TableHead className="font-semibold">Planting Date</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Seeds</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Harvest Date</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Yield (kg)</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productions.map((production) => (
            <TableRow key={production.id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(production.id)}
                  onCheckedChange={() => toggleOne(production.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{production.commodity}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {production.land?.name || "-"}
              </TableCell>
              <TableCell>
                {format(new Date(production.planting_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {production.seed_count.toLocaleString()}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {production.harvest_date
                  ? format(new Date(production.harvest_date), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell font-medium">
                {production.harvest_yield_kg
                  ? `${production.harvest_yield_kg.toLocaleString()} kg`
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge className={cn(statusStyles[production.status], "capitalize")}>
                  {production.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(production)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {production.status !== "harvested" && (
                      <DropdownMenuItem onClick={() => onHarvest(production)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Record Harvest
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(production)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
