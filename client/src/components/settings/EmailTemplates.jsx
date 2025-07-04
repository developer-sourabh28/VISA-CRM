import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useToast } from '../ui/use-toast';
import { Plus, Edit2, Trash2, Save, X, Mail, RefreshCw, MailPlus } from 'lucide-react';
import RichTextEditor from '../ui/rich-text-editor';
import { apiRequest } from '../../lib/api';
// import BackButton from '../BackButton';

const EmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: 'Client Welcome Template',
    type: 'CLIENT',
    subject: 'Welcome to Our Visa Services - {{firstName}}',
    body: '<h2>Dear {{firstName}} {{lastName}},</h2><p>Welcome to our visa services! We are pleased to have you as our client.</p><p>Your client details:</p><ul><li>Visa Type: {{visaType}}</li><li>Status: {{status}}</li><li>Destination Country: {{destinationCountry}}</li></ul><p>Our team will be working closely with you throughout your visa application process.</p><p>Best regards,<br>Visa Services Team</p>',
    variables: ['firstName', 'lastName', 'email', 'phone', 'visaType', 'status', 'destinationCountry']
  });

  // Fetch templates with proper error handling
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      try {
        const data = await apiRequest('GET', '/api/email-templates');
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
        const data = await apiRequest(method, url, {
          ...templateData,
          type: templateData.type.toUpperCase()
        });

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
        name: 'Client Welcome Template',
        type: 'CLIENT',
        subject: 'Welcome to Our Visa Services - {{firstName}}',
        body: '<h2>Dear {{firstName}} {{lastName}},</h2><p>Welcome to our visa services! We are pleased to have you as our client.</p><p>Your client details:</p><ul><li>Visa Type: {{visaType}}</li><li>Status: {{status}}</li><li>Destination Country: {{destinationCountry}}</li></ul><p>Our team will be working closely with you throughout your visa application process.</p><p>Best regards,<br>Visa Services Team</p>',
        variables: ['firstName', 'lastName', 'email', 'phone', 'visaType', 'status', 'destinationCountry']
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
        const data = await apiRequest('DELETE', `/api/email-templates/${templateId}`);
        
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
        name: 'Client Welcome Template',
        type: 'CLIENT',
        subject: 'Welcome to Our Visa Services - {{firstName}}',
        body: '<h2>Dear {{firstName}} {{lastName}},</h2><p>Welcome to our visa services! We are pleased to have you as our client.</p><p>Your client details:</p><ul><li>Visa Type: {{visaType}}</li><li>Status: {{status}}</li><li>Destination Country: {{destinationCountry}}</li></ul><p>Our team will be working closely with you throughout your visa application process.</p><p>Best regards,<br>Visa Services Team</p>',
        variables: ['firstName', 'lastName', 'email', 'phone', 'visaType', 'status', 'destinationCountry']
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative z-20 p-6 space-y-8">
        {/* <BackButton /> */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Email Templates
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5">
              Manage email templates for various communications
            </p>
          </div>

          <Button 
            onClick={() => handleOpenDialog()}
            className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <MailPlus className="w-5 h-5" />
            <span>New Template</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading templates...</span>
          </div>
        ) : templates?.length === 0 ? (
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative p-12 text-center">
              <Mail className="w-16 h-16 text-amber-500/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Templates Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first email template to get started.</p>
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates?.map((template) => (
              <div className="group relative overflow-hidden" key={template._id}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenDialog(template)}
                        className="p-1 rounded-full text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
                        className="p-1 rounded-full text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100/30 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100/40 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                        {template.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">Subject:</span> {template.subject}
                    </p>
                    <div className="mt-2 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg text-sm max-h-[150px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: template.body }} />
                    </div>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Available Variables:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map((variable, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 rounded-full text-xs"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white">
                <MailPlus className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedTemplate ? 'Edit Template' : 'New Template'}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Name</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Template name"
                  required
                  className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Type</label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENQUIRY">Enquiry</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Subject</label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Email subject"
                required
                className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Body</label>
              <RichTextEditor
                content={templateForm.body}
                onChange={(html) => setTemplateForm({ ...templateForm, body: html })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Variables (comma-separated)</label>
              <Input
                value={templateForm.variables.join(', ')}
                onChange={(e) => setTemplateForm({
                  ...templateForm,
                  variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                })}
                placeholder="firstName, lastName, email, etc."
                className="border border-gray-200/50 dark:border-gray-600/50 bg-transparent"
              />
            </div>
            
            <DialogFooter className="pt-4 space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
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