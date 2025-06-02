import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useToast } from '../ui/use-toast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import RichTextEditor from '../ui/rich-text-editor';

const EmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    subject: '',
    body: '',
    variables: []
  });

  // Fetch templates with proper error handling
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/email-templates', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch templates');
        }
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
      } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Create/Update template mutation
  const mutation = useMutation({
    mutationFn: async (templateData) => {
      const url = selectedTemplate 
        ? `/api/email-templates/${selectedTemplate._id}`
        : '/api/email-templates';
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method,
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...templateData,
            type: templateData.type.toUpperCase()
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.errors && Array.isArray(data.errors)) {
            throw new Error(data.errors.join('\n'));
          }
          throw new Error(data.message || 'Failed to save template');
        }

        if (!data.success) {
          throw new Error(data.message || 'Failed to save template');
        }

        return data.data;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      setIsDialogOpen(false);
      setTemplateForm({
        name: '',
        type: '',
        subject: '',
        body: '',
        variables: []
      });
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: `Template ${selectedTemplate ? 'updated' : 'created'} successfully.`
      });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      const errorMessages = error.message.split('\n');
      errorMessages.forEach(message => {
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
      });
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId) => {
      try {
        console.log('Attempting to delete template:', templateId);
        const response = await fetch(`/api/email-templates/${templateId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Delete response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete template');
        }

        if (!data.success) {
          throw new Error(data.message || 'Failed to delete template');
        }

        return data;
      } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailTemplates']);
      toast({
        title: "Success",
        description: "Template deleted successfully."
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleOpenDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables || []
      });
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: '',
        type: '',
        subject: '',
        body: '',
        variables: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim all string values
    const trimmedForm = {
      ...templateForm,
      name: templateForm.name.trim(),
      subject: templateForm.subject.trim(),
      variables: templateForm.variables.map(v => v.trim())
    };

    // Validate form data
    const validationErrors = [];
    if (!trimmedForm.name) validationErrors.push('Template name is required');
    if (!trimmedForm.type) validationErrors.push('Template type is required');
    if (!trimmedForm.subject) validationErrors.push('Subject is required');
    if (!trimmedForm.body) validationErrors.push('Body is required');

    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive"
        });
      });
      return;
    }

    mutation.mutate(trimmedForm);
  };

  const handleDelete = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(templateId);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          <p className="font-semibold">Error loading templates</p>
          <p className="text-sm mt-2">{error.message || "Please try again later."}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-6">
        {templates?.map((template) => (
          <Card key={template._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(template)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Type: {template.type}</p>
                <p className="text-sm font-medium">Subject: {template.subject}</p>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: template.body }} />
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Variables:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Template name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENQUIRY">Enquiry</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Email subject"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <RichTextEditor
                content={templateForm.body}
                onChange={(html) => setTemplateForm({ ...templateForm, body: html })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Variables (comma-separated)</label>
              <Input
                value={templateForm.variables.join(', ')}
                onChange={(e) => setTemplateForm({
                  ...templateForm,
                  variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                })}
                placeholder="firstName, lastName, email, etc."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedTemplate ? 'Update' : 'Create'} Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates; 