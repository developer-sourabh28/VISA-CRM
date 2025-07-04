import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation } from "wouter";
import { useToast } from "../components/ui/use-toast";
import { useUser } from "../context/UserContext";
import { Download, RefreshCw, DollarSign, CreditCard, Calendar, Search, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
// import BackButton from "../components/BackButton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, deletePayment, updatePayment } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import InvoiceTemplates from "../components/settings/InvoiceTemplates";

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Payments = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        clientName: '',
        status: '',
        paymentMethod: ''
    });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const { user } = useAuth();
    const [isInvoiceTemplateDialogOpen, setIsInvoiceTemplateDialogOpen] = useState(false);
    const [isCustomInvoiceDialogOpen, setIsCustomInvoiceDialogOpen] = useState(false);
    const [customInvoiceForm, setCustomInvoiceForm] = useState({
        clientName: '',
        clientAddress: '',
        notes: '',
        email: '',
        phone: '',
        passportNumber: '',
        totalAmount: '',
        totalAmountPayable: '',
        paymentMethod: '',
        terms: ''
    });

    const { data: paymentsData, isLoading, error } = useQuery({
        queryKey: ['payments', page, filters],
        queryFn: () => getPayments({ page, ...filters }),
        keepPreviousData: true,
    });

    const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || [];
    const pagination = paymentsData?.pagination || {};

    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            toast({
                title: 'Success',
                description: 'Payment deleted successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete payment.',
                variant: 'destructive',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updatePayment,
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            toast({
                title: 'Success',
                description: 'Payment updated successfully.',
            });
            setIsEditDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update payment.',
                variant: 'destructive',
            });
        },
    });

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleUpdatePayment = () => {
        if (selectedPayment) {
            updateMutation.mutate(selectedPayment);
        }
    };

    const openInvoiceTemplateDialog = () => {
        setIsInvoiceTemplateDialogOpen(true);
    };

    const defaultInvoiceTerms = [
        "This invoice covers assistance services only and does not guarantee visa approval.",
        "All fees are non-refundable, regardless of the outcome of the visa application.",
        "Services include application form assistance, documentation guidance, and appointment scheduling (if applicable).",
        "The client is responsible for providing truthful and complete documents."
    ].join("\n");

    const openCustomInvoiceDialog = (payment) => {
        setSelectedPayment(payment);
        setCustomInvoiceForm({
            clientName: `${payment.clientId?.firstName || ''} ${payment.clientId?.lastName || ''}`.trim(),
            clientAddress: payment.clientId?.address ? [
                payment.clientId.address.street,
                payment.clientId.address.city,
                payment.clientId.address.state,
                payment.clientId.address.postalCode,
                payment.clientId.address.country
            ].filter(Boolean).join(', ') : '',
            notes: payment.notes || '',
            email: payment.clientId?.email || '',
            phone: payment.clientId?.phone || '',
            passportNumber: payment.clientId?.passportNumber || '',
            totalAmount: payment.amount || '',
            totalAmountPayable: payment.amount || '',
            paymentMethod: payment.paymentMethod || '',
            terms: payment.terms || defaultInvoiceTerms
        });
        setIsCustomInvoiceDialogOpen(true);
    };

    const handleCustomInvoiceChange = (e) => {
        const { name, value } = e.target;
        setCustomInvoiceForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCustomInvoiceSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayment) return;
        try {
            const response = await api.post(`/payments/invoice/${selectedPayment._id}/custom`, customInvoiceForm, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${selectedPayment._id}_custom.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setIsCustomInvoiceDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate custom invoice.',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) return <div>Loading payments...</div>;
    if (error) return <div>Error loading payments: {error.message}</div>;

    console.log("Payments data:", payments);

    const getInstallmentColor = (payment) => {
        if (payment.paymentType !== 'Partial Payment') return 'bg-transparent';
        if (payment.status === 'Completed') return 'bg-green-500';
        
        const installmentsLeft = payment.numberOfInstallments - payment.installmentsPaid;
        if (installmentsLeft >= 3) return 'bg-red-500';
        if (installmentsLeft === 2) return 'bg-orange-500';
        if (installmentsLeft === 1) return 'bg-yellow-500';
        
        return 'bg-green-500';
    };

    const handleGenerateInvoice = async (paymentId) => {
        try {
            const response = await api.get(`/payments/invoice/${paymentId}`, {
                responseType: 'blob',
            });
            // Create a link to download the PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error generating invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate invoice.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 rounded-full"></div>
               <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
                Payments
              </h1>
            </div>

            <div className="flex space-x-4 mb-4">
                {/* <Input
                    name="clientName"
                    placeholder="Filter by client name..."
                    value={filters.clientName}
                    onChange={handleFilterChange}
                /> */}
                <Select
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                    value={filters.status || 'all'}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => setFilters({ ...filters, paymentMethod: value === 'all' ? '' : value })}
                    value={filters.paymentMethod || 'all'}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Installments</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => {
                        const isOwner = user?.id === payment.recordedBy || user?.role === 'admin';
                        const isEnquiryPayment = payment.isEnquiryPayment;
                        return (
                            <TableRow key={payment._id}>
                                <TableCell>
                                    {payment.clientId?.firstName} {payment.clientId?.lastName}
                                    {isEnquiryPayment && (
                                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            Enquiry
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div>{payment.amount !== undefined && payment.amount !== null ? `د.إ${payment.amount}` : '-'}</div>
                                    {payment.paymentType === 'Partial Payment' && payment.amountLeft !== undefined && (
                                        <div className="text-xs text-gray-500">
                                            (Remaining: د.إ{payment.amountLeft})
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{payment.paymentMethod}</TableCell>
                                <TableCell>{payment.status}</TableCell>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {payment.paymentType === 'Partial Payment' && payment.dueDate ? (
                                        <div>{new Date(payment.dueDate).toLocaleDateString()}</div>
                                    ) : (
                                        'N/A'
                                    )}
                                </TableCell>
                                <TableCell>
                                    {/* Show number of installments instead of color */}
                                    {payment.installments && typeof payment.installments.currentInstallment === 'number' && typeof payment.installments.totalCount === 'number' ? (
                                        <span>{payment.installments.currentInstallment}/{payment.installments.totalCount}</span>
                                    ) : (typeof payment.installmentsPaid === 'number' && typeof payment.numberOfInstallments === 'number' ? (
                                        <span>{payment.installmentsPaid}/{payment.numberOfInstallments}</span>
                                    ) : (
                                        'N/A'
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        isEnquiryPayment 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {isEnquiryPayment ? 'Enquiry' : 'Client'}
                                    </span>
                                </TableCell>
                                <TableCell>
  <Button
    variant="ghost"
    className="text-amber-600 hover:text-amber-700 px-6 w-full sm:w-auto"
    size="sm"
    onClick={() => handleGenerateInvoice(payment._id)}
  >
    Generate Invoice
  </Button>
  <Button
    variant="ghost"
    className="ml-2 text-amber-600 hover:text-amber-700"
    size="sm"
    onClick={() => openCustomInvoiceDialog(payment)}
  >
    Edit Invoice
  </Button>
</TableCell>

                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="flex justify-between items-center mt-4">
                <Button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                <Button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                >
                    Next
                </Button>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Payment</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div>
                                <Label>Amount</Label>
                                <Input
                                    value={selectedPayment.amount}
                                    onChange={(e) => setSelectedPayment({ ...selectedPayment, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={selectedPayment.status}
                                    onValueChange={(value) => setSelectedPayment({ ...selectedPayment, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdatePayment}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInvoiceTemplateDialogOpen} onOpenChange={setIsInvoiceTemplateDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Invoice Template</DialogTitle>
                    </DialogHeader>
                    <InvoiceTemplates />
                </DialogContent>
            </Dialog>

            <Dialog open={isCustomInvoiceDialogOpen} onOpenChange={setIsCustomInvoiceDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Custom Invoice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCustomInvoiceSubmit} className="space-y-4">
                        <div>
                            <Label>Client Name</Label>
                            <Input name="clientName" value={customInvoiceForm.clientName} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Client Address</Label>
                            <Input name="clientAddress" value={customInvoiceForm.clientAddress} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input name="email" value={customInvoiceForm.email} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input name="phone" value={customInvoiceForm.phone} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Passport Number</Label>
                            <Input name="passportNumber" value={customInvoiceForm.passportNumber} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Total Amount</Label>
                            <Input name="totalAmount" value={customInvoiceForm.totalAmount} onChange={handleCustomInvoiceChange} type="number" />
                        </div>
                        <div>
                            <Label>Total Amount Payable</Label>
                            <Input name="totalAmountPayable" value={customInvoiceForm.totalAmountPayable} onChange={handleCustomInvoiceChange} type="number" />
                        </div>
                        <div>
                            <Label>Payment Method</Label>
                            <Input name="paymentMethod" value={customInvoiceForm.paymentMethod} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea name="notes" value={customInvoiceForm.notes} onChange={handleCustomInvoiceChange} />
                        </div>
                        <div>
                            <Label>Terms</Label>
                            <Textarea name="terms" value={customInvoiceForm.terms} onChange={handleCustomInvoiceChange} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCustomInvoiceDialogOpen(false)} type="button">Cancel</Button>
                            <Button type="submit">Generate Custom Invoice</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Payments;
