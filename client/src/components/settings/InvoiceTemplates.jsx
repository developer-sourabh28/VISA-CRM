import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useToast } from '../ui/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const defaultTemplate = {
  name: '',
  body: '',
  variables: [],
};

const InvoiceTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(defaultTemplate);

  // Fetch templates
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['invoiceTemplates'],
    queryFn: async () => {
      const data = await apiRequest('GET', '/api/invoice-templates');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  // Create/Update template
  const mutation = useMutation({
    mutationFn: async (templateData) => {
      const url = selectedTemplate
        ? `/api/invoice-templates/${selectedTemplate._id}`
        : '/api/invoice-templates';
      const method = selectedTemplate ? 'PUT' : 'POST';
      const data = await apiRequest(method, url, templateData);
      if (!data.success) throw new Error(data.message || 'Failed to save template');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoiceTemplates']);
      setIsDialogOpen(false);
      setTemplateForm(defaultTemplate);
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: `Template ${selectedTemplate ? 'updated' : 'created'} successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (templateId) => {
      const data = await apiRequest('DELETE', `/api/invoice-templates/${templateId}`);
      if (!data.success) throw new Error(data.message || 'Failed to delete template');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoiceTemplates']);
      toast({
        title: "Success",
        description: "Template deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOpenDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        body: template.body,
        variables: template.variables || []
      });
    } else {
      setSelectedTemplate(null);
      setTemplateForm(defaultTemplate);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedForm = {
      ...templateForm,
      name: templateForm.name.trim(),
      body: templateForm.body.trim(),
      variables: templateForm.variables.map(v => v.trim())
    };
    if (!trimmedForm.name || !trimmedForm.body) {
      toast({
        title: "Validation Error",
        description: "Name and body are required.",
        variant: "destructive"
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Templates</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error.message}</div>
        ) : templates?.length === 0 ? (
          <div>No templates found.</div>
        ) : (
          templates.map((template) => (
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
                  <div className="text-sm whitespace-pre-wrap">{template.body}</div>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Variables:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {template.variables.map((variable, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 rounded text-xs"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Invoice Template' : 'New Invoice Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
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
              <label className="text-sm font-medium">Body (HTML or Text)</label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Invoice template body. Use {{clientName}}, {{amount}}, etc."
                rows={8}
                required
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
                placeholder="clientName, amount, date, etc."
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

export default InvoiceTemplates;