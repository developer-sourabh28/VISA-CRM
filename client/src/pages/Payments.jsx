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
    const { user } = useAuth();

    const { data: paymentsData, isLoading, error } = useQuery({
        queryKey: ['payments', page, filters],
        queryFn: () => getPayments({ page, ...filters }),
        keepPreviousData: true,
    });

    const payments = paymentsData?.data || [];
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
                                            setIsEditDialogOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="ml-2"
                                        onClick={() => deleteMutation.mutate(payment._id)}
                                    >
                                        Delete
                                    </Button>
                                    {isOwner && <Button size="sm" className="ml-2">Generate Invoice</Button>}
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
        </div>
    );
};

export default Payments;
