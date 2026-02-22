import { motion } from 'motion/react';
import {
  Plus,
  Download,
  FileText,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  GripVertical,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useState, useMemo } from 'react';
import { useTimeTracking, myTasks } from '../context/TimeTrackingContext';

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  issueDate: string;
}

const invoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-1247',
    client: 'Acme Corporation',
    amount: 12500,
    status: 'paid',
    dueDate: '2026-02-15',
    issueDate: '2026-02-01',
  },
  {
    id: '2',
    number: 'INV-1248',
    client: 'TechStart Inc',
    amount: 8750,
    status: 'pending',
    dueDate: '2026-02-28',
    issueDate: '2026-02-14',
  },
  {
    id: '3',
    number: 'INV-1249',
    client: 'Global Systems',
    amount: 15200,
    status: 'overdue',
    dueDate: '2026-02-10',
    issueDate: '2026-01-27',
  },
  {
    id: '4',
    number: 'INV-1250',
    client: 'Innovation Labs',
    amount: 6300,
    status: 'draft',
    dueDate: '2026-03-15',
    issueDate: '2026-02-20',
  },
  {
    id: '5',
    number: 'INV-1246',
    client: 'Acme Corporation',
    amount: 9800,
    status: 'paid',
    dueDate: '2026-01-31',
    issueDate: '2026-01-17',
  },
];

const clients = [
  {
    id: '1',
    name: 'Acme Corporation',
    contact: 'John Smith',
    email: 'john@acme.com',
    phone: '+1 (555) 123-4567',
    totalInvoiced: 22300,
    invoiceCount: 2,
  },
  {
    id: '2',
    name: 'TechStart Inc',
    contact: 'Sarah Johnson',
    email: 'sarah@techstart.com',
    phone: '+1 (555) 234-5678',
    totalInvoiced: 8750,
    invoiceCount: 1,
  },
  {
    id: '3',
    name: 'Global Systems',
    contact: 'Mike Chen',
    email: 'mike@globalsystems.com',
    phone: '+1 (555) 345-6789',
    totalInvoiced: 15200,
    invoiceCount: 1,
  },
  {
    id: '4',
    name: 'Innovation Labs',
    contact: 'Emily Davis',
    email: 'emily@innovationlabs.com',
    phone: '+1 (555) 456-7890',
    totalInvoiced: 6300,
    invoiceCount: 1,
  },
];

const statusColors = {
  paid: 'bg-success/10 text-success border-success/20',
  pending: 'bg-info/10 text-info border-info/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-border',
};

// Map Projects to Clients.
const projectToClientMap: Record<string, typeof clients[0]> = {
  'Mobile App Redesign': clients[0], // Acme Corporation
  'Dashboard v2': clients[1],        // TechStart Inc
  'Marketing Website': clients[2],   // Global Systems
};

export function Invoices() {
  const { entries } = useTimeTracking();
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(200);

  // Group entries by task and calculate duration sum where project matches
  const invoiceItems = useMemo(() => {
    if (!selectedProjectId) return [];

    // selectedProjectId correlates to the project ID or Name. The `myTasks` uses `id` for tracking, but projects are stored by full string name in current implementation.
    // In our mockup, myTasks looks like: { id: 't1', title: '...', project: 'Mobile App Redesign' }
    const project = myTasks.find(p => p.id === selectedProjectId)?.project || '';

    // Grouping logic for matched entries
    const itemsMap = new Map<string, number>(); // Task Title -> Total Minutes
    entries.forEach(entry => {
      if (entry.project === project) {
        const currentDuration = itemsMap.get(entry.task) || 0;
        itemsMap.set(entry.task, currentDuration + entry.duration);
      }
    });

    // Convert map to array { item, qty (hours) }
    const formattedItems = Array.from(itemsMap.entries()).map(([taskTitle, totalMins]) => {
      return {
        item: taskTitle,
        qty: Math.max(1, Math.round((totalMins / 60) * 10) / 10), // Hours rounded to 1 decimal, min 1 
      };
    });

    return formattedItems;
  }, [selectedProjectId, entries]);

  const subTotal = invoiceItems.reduce((acc, curr) => acc + (curr.qty * hourlyRate), 0);
  const selectedProjectObj = myTasks.find(p => p.id === selectedProjectId);
  const mappedClient = selectedProjectObj ? projectToClientMap[selectedProjectObj.project] : null;

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPending = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl mb-2">Invoices & Clients</h1>
            <p className="text-muted-foreground">Manage invoices and client relationships</p>
          </div>
          <Button onClick={() => setIsNewInvoiceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1">
              ${(totalPaid + totalPending + totalOverdue).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Invoiced</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-success">
              ${totalPaid.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-info">
              ${totalPending.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-destructive">
              ${totalOverdue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
        </motion.div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Building2 className="h-4 w-4 mr-2" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-9 bg-input-background"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">
                      {invoice.number}
                    </TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell className="font-semibold">
                      ${invoice.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="clients">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-9 bg-input-background"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.contact}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.phone}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Total Invoiced</p>
                        <p className="font-semibold">${client.totalInvoiced.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Invoices</p>
                        <p className="font-semibold">{client.invoiceCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      New Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* New Invoice Modal */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <DialogTitle className="text-lg">Invoice</DialogTitle>
            <Badge variant="outline" className="bg-muted text-muted-foreground">Draft</Badge>
          </DialogHeader>

          <div className="py-6 flex flex-col gap-8">
            {/* Top Config Section */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input defaultValue={`INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100)}`} />
                </div>
                <div className="space-y-2">
                  <Label>Issued on</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due</Label>
                    <Select defaultValue="receipt">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Upon Receipt</SelectItem>
                        <SelectItem value="net15">Net 15</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rate (per hr)</Label>
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <div>
                  <Label className="text-muted-foreground mb-1 block">From</Label>
                  <div className="font-medium text-sm">Amukelani Shiringani</div>
                  <div className="text-sm text-muted-foreground">amushiringani@gmail.com</div>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-1 block">Bill to</Label>
                  {mappedClient ? (
                    <>
                      <div className="font-medium text-sm">{mappedClient.name}</div>
                      <div className="text-sm text-muted-foreground">{mappedClient.email}</div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Select a project...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Using distinct projects from myTasks */}
                      {Array.from(new Set(myTasks.map(t => t.project))).map(projName => {
                        const taskRep = myTasks.find(t => t.project === projName)!;
                        return (
                          <SelectItem key={taskRep.id} value={taskRep.id}>
                            {projName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items List */}
                <div className="mt-4 flex flex-col gap-4">
                  {invoiceItems.length > 0 ? (
                    invoiceItems.map((itm, idx) => (
                      <div key={idx} className="flex flex-row items-center gap-4">
                        <div className="text-muted-foreground/40 pt-6 cursor-grab">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs font-normal text-muted-foreground ml-1">Items</Label>
                          <Input value={itm.item} className="h-10 bg-background" readOnly />
                        </div>

                        <div className="w-[70px] space-y-1.5">
                          <Label className="text-xs font-normal text-muted-foreground ml-1">Qty</Label>
                          <Input value={itm.qty} className="h-10 text-center bg-background px-2" readOnly />
                        </div>

                        <div className="w-[110px] space-y-1.5">
                          <Label className="text-xs font-normal text-muted-foreground ml-1">Rate</Label>
                          <Input value={`$${hourlyRate.toFixed(2)}`} className="h-10 bg-background px-3" readOnly />
                        </div>

                        <div className="w-[110px] space-y-1.5">
                          <Label className="text-xs font-normal text-muted-foreground ml-1 block">Total</Label>
                          <div className="h-10 flex items-center font-medium text-[15px]">
                            ${(itm.qty * hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="pt-6">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                      Select a project to auto-fill tracked time.
                    </div>
                  )}
                </div>

                <div className="pt-4 pb-2">
                  <Button variant="ghost" className="text-foreground hover:bg-transparent font-medium px-1 hover:underline underline-offset-4">
                    <Plus className="mr-2 h-4 w-4" /> Add an item
                  </Button>
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex items-center gap-6 pt-4 mt-2 border-t border-border">
              <div className="text-muted-foreground text-sm font-medium pt-2">Total</div>
              <div className="flex-1 flex justify-end">
                <Button className="h-12 px-6 rounded-lg font-medium text-base bg-[#2d81ff] hover:bg-[#2d81ff]/90 text-white shadow-md shadow-blue-500/20">
                  <span className="font-semibold mr-2">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="opacity-60 text-xs mx-1 pb-0.5">•</span>
                  <span className="ml-1">Generate invoice</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
