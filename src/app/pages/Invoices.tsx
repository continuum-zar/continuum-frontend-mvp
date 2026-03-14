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
import { useState, useMemo, useCallback } from 'react';
import { useInvoices, downloadInvoice, generateInvoicePdf, generateInvoice } from '@/api/invoices';
import { useClients } from '@/api/clients';
import { useCreateClient, useClientDetail } from '@/api/hooks';
import { useRole } from '@/app/context/RoleContext';
import { useAuthStore } from '@/store/authStore';
import { fetchProjects } from '@/api/projects';
import { fetchLoggedHours } from '@/api/loggedHours';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError, isAxiosError } from 'axios';
import { exportToCSV } from '@/lib/utils/export';

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success border-success/20',
  pending: 'bg-info/10 text-info border-info/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-border',
  sent: 'bg-info/10 text-info border-info/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export function Invoices() {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: clients = [], isLoading: isClientsLoading, error: clientsError } = useClients();
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<Record<string, 'view' | 'download' | null>>({});

  const { role } = useRole();
  const user = useAuthStore((s) => s.user);
  const { mutate: createClient, isPending: isCreatingClient } = useCreateClient();
  const { data: clientDetail, isLoading: isClientDetailLoading } = useClientDetail(selectedClientId);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    contact: '',
    phone: '',
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  /**
   * Client-side CSV export of the currently filtered/visible invoices.
   * This approach was chosen as there is currently no backend endpoint for bulk invoice export.
   */
  const handleExport = useCallback(() => {
    if (filteredInvoices.length === 0) {
      toast.info('No invoices to export.');
      return;
    }

    const csvData = filteredInvoices.map((inv) => ({
      'ID': inv.id,
      'Invoice Number': inv.number,
      'Client': inv.client,
      'Amount': inv.amount,
      'Issue Date': new Date(inv.issueDate).toLocaleDateString(),
      'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
      'Status': inv.status,
    }));

    exportToCSV(csvData, `invoices-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Invoices exported successfully.');
  }, [filteredInvoices]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    createClient(newClient, {
      onSuccess: () => {
        setIsAddClientOpen(false);
        setNewClient({ name: '', email: '', contact: '', phone: '' });
        toast.success('Client added successfully');
      },
    });
  };

  const handleViewClientDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsClientDetailsOpen(true);
  };

  const handleInvoiceAction = async (invoiceId: string | number, number: string, action: 'view' | 'download') => {
    setIsProcessing(prev => ({ ...prev, [invoiceId]: action }));
    try {
      let result: { blob: Blob; filename: string };
      try {
        result = await downloadInvoice(invoiceId);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) {
          toast.info(`Generating PDF for ${number}...`);
          await generateInvoicePdf(invoiceId);
          await new Promise(resolve => setTimeout(resolve, 1000));
          result = await downloadInvoice(invoiceId);
        } else {
          throw error;
        }
      }

      const url = window.URL.createObjectURL(result.blob);
      if (action === 'view') {
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Invoice PDF error:', error);
      toast.error(`Failed to ${action} invoice PDF.`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [invoiceId]: null }));
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      client.contact.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );
  }, [clients, clientSearchQuery]);

  // New Invoice Form State (selectedProjectId is project_id as string for project selector)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(200);
  const [billingPeriodStart, setBillingPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview data from logged hours
  const { data: previewHours = [], isLoading: isPreviewLoading } = useQuery({
    queryKey: ['logged-hours', 'preview', selectedProjectId, billingPeriodStart, billingPeriodEnd],
    queryFn: () => fetchLoggedHours({
      project_id: selectedProjectId,
      start_date: billingPeriodStart,
      end_date: billingPeriodEnd,
    }),
    enabled: !!selectedProjectId && !!billingPeriodStart && !!billingPeriodEnd && isNewInvoiceOpen,
  });

  // Distinct projects from API for dropdown
  const projectOptions = useMemo(() => {
    return projects.map((p) => ({ project_id: p.apiId, project: p.title }));
  }, [projects]);

  // Group entries by task and calculate duration sum where project matches
  const invoiceItems = useMemo(() => {
    if (!selectedProjectId || previewHours.length === 0) return [];

    // Grouping logic for matched entries
    const itemsMap = new Map<string, number>(); // Task Title -> Total Minutes
    previewHours.forEach(entry => {
      const currentDuration = itemsMap.get(entry.task) || 0;
      itemsMap.set(entry.task, currentDuration + entry.duration);
    });

    // Convert map to array { item, qty (hours) }
    const formattedItems = Array.from(itemsMap.entries()).map(([taskTitle, totalMins]) => {
      return {
        item: taskTitle,
        qty: Math.max(0.1, Math.round((totalMins / 60) * 10) / 10), // Hours rounded to 1 decimal
      };
    });

    return formattedItems;
  }, [selectedProjectId, previewHours]);

  const subTotal = invoiceItems.reduce((acc, curr) => acc + (curr.qty * hourlyRate), 0);
  const selectedProject = projects.find((p) => String(p.apiId) === selectedProjectId);

  // Find mapped client based on invoices or client name (if available on project)
  const mappedClient = useMemo(() => {
    if (!selectedProject) return null;

    // Find any invoice for this project to get the client name
    // More robust: find by client name from invoices matching this project
    const clientName = invoices.find(inv => inv.client && invoices.some(i => i.id === inv.id))?.client;

    return clients.find(c => c.name === clientName);
  }, [selectedProject, invoices, clients]);

  const handleGenerateInvoice = async () => {
    if (!selectedProjectId || !billingPeriodStart || !billingPeriodEnd) {
      toast.error('Please select a project and billing period.');
      return;
    }

    setIsGenerating(true);
    try {
      await generateInvoice({
        project_id: selectedProjectId,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        status: 'draft',
        tax_rate: taxRate,
        hourly_rate_override: hourlyRate,
      });
      toast.success('Invoice generated successfully.');
      setIsNewInvoiceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err: unknown) {
      console.error('Failed to generate invoice:', err);
      const errorRes = err as { response?: { data?: { detail?: string | Array<{ msg?: string }> } }; message?: string };
      const rawDetail = errorRes.response?.data?.detail;
      const message =
        typeof rawDetail === 'string'
          ? rawDetail
          : Array.isArray(rawDetail) && rawDetail.length > 0
            ? rawDetail.map((e) => e.msg ?? JSON.stringify(e)).join(' ')
            : errorRes.message || 'Failed to generate invoice.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalInvoiced = invoices
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPending = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

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
              ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">Total Invoiced</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-success">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-info">
              ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-2xl font-semibold mb-1 text-destructive">
              ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <Button variant="outline" size="sm" onClick={handleExport}>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Alert variant="destructive" className="max-w-md mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load invoices. Please try again later.
                        </AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' ? 'No invoices match your filters.' : 'No invoices found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
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
                        <Badge className={statusColors[invoice.status.toLowerCase()] || statusColors.draft}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!!isProcessing[invoice.id]}
                            onClick={() => handleInvoiceAction(invoice.id, invoice.number, 'view')}
                          >
                            {isProcessing[invoice.id] === 'view' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'View'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!!isProcessing[invoice.id]}
                            onClick={() => handleInvoiceAction(invoice.id, invoice.number, 'download')}
                          >
                            {isProcessing[invoice.id] === 'download' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                />
              </div>
              {role === 'Admin' && (
                <Button onClick={() => setIsAddClientOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isClientsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Skeleton className="w-12 h-12 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              ) : clientsError ? (
                <div className="col-span-2 p-12 text-center bg-card border border-border rounded-lg">
                  <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {clientsError instanceof AxiosError && clientsError.response?.status === 403
                        ? 'Admin access required to view clients.'
                        : 'Failed to load clients. Please try again later.'}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="col-span-2 p-12 text-center text-muted-foreground bg-card border border-border rounded-lg border-dashed">
                  {clientSearchQuery ? 'No clients match your search.' : 'No clients found.'}
                </div>
              ) : (
                filteredClients.map((client) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewClientDetails(client.id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Try to find a project for this client to pre-select
                          const clientProject = projects.find(p => p.clientId === Number(client.id));
                          if (clientProject) {
                            setSelectedProjectId(String(clientProject.apiId));
                          }
                          setIsNewInvoiceOpen(true);
                        }}
                      >
                        New Invoice
                      </Button>
                    </div>
                  </div>
                ))
              )}
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
                  <Label htmlFor="billing-period-start">Billing Period Start</Label>
                  <Input
                    id="billing-period-start"
                    type="date"
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-period-end">Billing Period End</Label>
                  <Input
                    id="billing-period-end"
                    type="date"
                    value={billingPeriodEnd}
                    onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-rate">Default Rate (Preview only)</Label>
                    <Input
                      id="default-rate"
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
                  <div className="font-medium text-sm">
                    {user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">{user?.email ?? '—'}</div>
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
                  <Label htmlFor="invoice-project">Project</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="invoice-project">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map(({ project_id, project }) => (
                        <SelectItem key={project_id} value={String(project_id)}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items List */}
                <div className="mt-4 flex flex-col gap-4">
                  {isPreviewLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : invoiceItems.length > 0 ? (
                    invoiceItems.map((itm, idx) => (
                      <div key={idx} className="flex flex-row items-center gap-4">
                        <div className="text-muted-foreground/40 pt-6 cursor-grab">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor={`invoice-item-${idx}`} className="text-xs font-normal text-muted-foreground ml-1">Items</Label>
                          <Input id={`invoice-item-${idx}`} value={itm.item} className="h-10 bg-background" readOnly />
                        </div>

                        <div className="w-[70px] space-y-1.5">
                          <Label htmlFor={`invoice-qty-${idx}`} className="text-xs font-normal text-muted-foreground ml-1">Qty</Label>
                          <Input id={`invoice-qty-${idx}`} value={itm.qty} className="h-10 text-center bg-background px-2" readOnly />
                        </div>

                        <div className="w-[110px] space-y-1.5">
                          <Label htmlFor={`invoice-rate-${idx}`} className="text-xs font-normal text-muted-foreground ml-1">Rate</Label>
                          <Input id={`invoice-rate-${idx}`} value={`$${hourlyRate.toFixed(2)}`} className="h-10 bg-background px-3" readOnly />
                        </div>

                        <div className="w-[110px] space-y-1.5">
                          <span id={`invoice-total-label-${idx}`} className="text-xs font-normal text-muted-foreground ml-1 block">Total</span>
                          <div className="h-10 flex items-center font-medium text-[15px]" aria-labelledby={`invoice-total-label-${idx}`}>
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
                      {selectedProjectId ? 'No hours logged for this project in the selected period.' : 'Select a project to auto-fill tracked time.'}
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
              <div className="text-muted-foreground text-sm font-medium pt-2">Total (Preview)</div>
              <div className="flex-1 flex justify-end">
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={isGenerating || !selectedProjectId || invoiceItems.length === 0}
                  className="h-12 px-6 rounded-lg font-medium text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <span className="font-semibold mr-2">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="opacity-60 text-xs mx-1 pb-0.5">•</span>
                    </>
                  )}
                  <span className="ml-1">Generate invoice</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal (admin only) */}
      {role === 'Admin' && (
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                required
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email Address</Label>
              <Input
                id="client-email"
                type="email"
                required
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                placeholder="e.g. billing@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-contact">Primary Contact</Label>
              <Input
                id="client-contact"
                value={newClient.contact}
                onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone Number</Label>
              <Input
                id="client-phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="e.g. +1 (555) 000-0000"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingClient}>
                {isCreatingClient ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* Client Details Modal */}
      <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {isClientDetailLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clientDetail ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{clientDetail.name}</h2>
                  <p className="text-muted-foreground">{clientDetail.contact || 'No contact specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {clientDetail.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {clientDetail.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-medium mb-4">Financial Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Invoiced</p>
                    <p className="text-lg font-semibold">${(clientDetail.total_invoiced ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Invoices</p>
                    <p className="text-lg font-semibold">{clientDetail.invoice_count ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsClientDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Failed to load client details.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
