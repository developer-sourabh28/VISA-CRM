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
import BackButton from "../components/BackButton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, deletePayment, updatePayment } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

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
    const [customInvoiceData, setCustomInvoiceData] = useState({});
    const { user } = useAuth();

    const { data: paymentsData, isLoading, error } = useQuery({
        queryKey: ['payments', page, filters],
        queryFn: () => getPayments({ page, ...filters }),
        keepPreviousData: true,
    });

    const payments = paymentsData || [];
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

    const handleGenerateCustomInvoice = async () => {
        if (!selectedPayment) return;
        try {
            const response = await api.post(`/payments/invoice/${selectedPayment._id}/custom`, customInvoiceData, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');

            toast({
                title: 'Invoice Generated',
                description: 'Your custom invoice has been generated and opened in a new tab.',
            });
            setIsEditDialogOpen(false);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Invoice Generation Failed',
                description: err.message || 'There was a problem generating the invoice.',
            });
        }
    };

    const handleGenerateInvoice = async (paymentId) => {
        try {
            const response = await api.get(`/payments/invoice/${paymentId}`, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');

            toast({
                title: 'Invoice Generated',
                description: 'Your invoice has been generated and opened in a new tab.',
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Invoice Generation Failed',
                description: err.message || 'There was a problem generating the invoice.',
            });
        }
    };

    if (isLoading) return <div>Loading payments...</div>;
    if (error) return <div>Error loading payments: {error.message}</div>;

    const getInstallmentColor = (payment) => {
        if (payment.paymentType !== 'Partial Payment') return 'bg-transparent';
        if (payment.status === 'Completed') return 'bg-green-500';
        
        const installmentsLeft = payment.numberOfInstallments - payment.installmentsPaid;
        if (installmentsLeft >= 3) return 'bg-red-500';
        if (installmentsLeft === 2) return 'bg-orange-500';
        if (installmentsLeft === 1) return 'bg-yellow-500';
        
        return 'bg-green-500';
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Payments</h1>

            <div className="flex space-x-4 mb-4">
                <Input
                    name="clientName"
                    placeholder="Filter by client name..."
                    value={filters.clientName}
                    onChange={handleFilterChange}
                />
                <Select
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by payment method" />
                    </SelectTrigger>
                    <SelectContent>
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
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => {
                        const isOwner = user?.id === payment.recordedBy || user?.role === 'admin';
                        return (
                            <TableRow key={payment._id}>
                                <TableCell>{payment.clientId?.firstName} {payment.clientId?.lastName}</TableCell>
                                <TableCell>
                                    <div>{isOwner ? `$${payment.amount}` : '-'}</div>
                                    {payment.paymentType === 'Partial Payment' && isOwner && (
                                        <div className="text-xs text-gray-500">
                                            (Remaining: ${payment.amountLeft})
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
                                    <span className={`h-4 w-4 rounded-full inline-block ${getInstallmentColor(payment)}`}></span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedPayment(payment);
                                            setCustomInvoiceData({
                                                clientName: `${payment.clientId?.firstName || ''} ${payment.clientId?.lastName || ''}`.trim(),
                                                clientAddress: [payment.clientId?.address?.street, payment.clientId?.address?.city, payment.clientId?.address?.state, payment.clientId?.address?.postalCode, payment.clientId?.address?.country].filter(Boolean).join(', '),
                                                email: payment.clientId?.email,
                                                phone: payment.clientId?.phone,
                                                passportNumber: payment.clientId?.passportNumber,
                                                totalAmount: payment.amount,
                                                totalAmountPayable: payment.amount,
                                                paymentMethod: payment.paymentMethod,
                                                description: payment.description || '',
                                                notes: payment.notes || '',
                                                terms: "This invoice covers assistance services only and does not guarantee visa approval.\nAll fees are non-refundable, regardless of the outcome of the visa application."
                                            });
                                            setIsEditDialogOpen(true);
                                        }}
                                    >
                                        Edit Invoice
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="ml-2"
                                        onClick={() => handleGenerateInvoice(payment._id)}>
                                        Generate Invoice
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
                        <DialogTitle>Edit Invoice Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Client Name</Label>
                                    <Input value={customInvoiceData.clientName} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, clientName: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Client Address</Label>
                                    <Input value={customInvoiceData.clientAddress} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, clientAddress: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input value={customInvoiceData.email} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, email: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input value={customInvoiceData.phone} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Passport Number</Label>
                                    <Input value={customInvoiceData.passportNumber} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, passportNumber: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Total Amount</Label>
                                    <Input type="number" value={customInvoiceData.totalAmount} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, totalAmount: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Total Amount Payable</Label>
                                    <Input type="number" value={customInvoiceData.totalAmountPayable} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, totalAmountPayable: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Payment Method</Label>
                                    <Input value={customInvoiceData.paymentMethod} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, paymentMethod: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea value={customInvoiceData.description} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, description: e.target.value })} rows={3} />
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Textarea value={customInvoiceData.notes} onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, notes: e.target.value })} rows={3} />
                            </div>
                            <div>
                                <Label>Terms & Conditions</Label>
                                <Textarea
                                    value={customInvoiceData.terms}
                                    onChange={(e) => setCustomInvoiceData({ ...customInvoiceData, terms: e.target.value })}
                                    rows={5}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateCustomInvoice}>Generate Custom Invoice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Payments;
