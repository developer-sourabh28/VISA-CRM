import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const CreateReminder = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const createReminderMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      toast.success('Reminder created successfully');
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create reminder');
    },
  });

  const onSubmit = (data) => {
    createReminderMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Reminder</CardTitle>
        <CardDescription>Add a new reminder to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={(value) => setValue('category', value)}
              defaultValue="OTHER"
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter reminder title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Enter reminder description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate', { required: 'Due date is required' })}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              onValueChange={(value) => setValue('priority', value)}
              defaultValue="MEDIUM"
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onSuccess) onSuccess();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReminderMutation.isLoading}
            >
              {createReminderMutation.isLoading ? 'Creating...' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateReminder; 