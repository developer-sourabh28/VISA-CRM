// DOM Elements
const enquiryForm = document.getElementById('enquiryForm');
const enquiriesTable = document.getElementById('enquiriesTable').querySelector('tbody');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModalBtn = document.querySelector('.close');

// Today's date for default enquiry date
const today = new Date().toISOString().split('T')[0];
document.getElementById('enquiryDate').value = today;

// Tab functionality
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabId).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // If showing the enquiry list, refresh the data
    if (tabId === 'enquiry-list') {
        fetchEnquiries();
    }
}

// Fetch all enquiries and display them
async function fetchEnquiries() {
    try {
        const response = await fetch('/enquiries');
        const data = await response.json();
        
        // Clear existing table rows
        enquiriesTable.innerHTML = '';
        
        if (data.length === 0) {
            // Display "No enquiries found" message
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" style="text-align: center;">No enquiries found</td>';
            enquiriesTable.appendChild(row);
            return;
        }
        
        // Add each enquiry to the table
        data.forEach(enquiry => {
            const row = document.createElement('tr');
            
            // Format date
            const enquiryDate = new Date(enquiry.enquiryDate).toLocaleDateString();
            
            // Create status badge class
            const statusClass = `status-badge status-${enquiry.enquiryStatus.toLowerCase()}`;
            
            row.innerHTML = `
                <td>${enquiry.fullName}</td>
                <td>${enquiry.phone}</td>
                <td>${enquiry.visaType}</td>
                <td><span class="${statusClass}">${enquiry.enquiryStatus}</span></td>
                <td>${enquiry.assignedConsultant || '-'}</td>
                <td>${enquiryDate}</td>
                <td class="action-buttons">
                    <button class="action-btn btn-edit" onclick="openEditModal(${enquiry.id})">Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteEnquiry(${enquiry.id})">Delete</button>
                </td>
            `;
            
            enquiriesTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        alert('Failed to load enquiries. Please try again later.');
    }
}

// Handle form submission to create a new enquiry
enquiryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data as an object
    const formData = new FormData(this);
    const enquiryData = {};
    
    for (const [key, value] of formData.entries()) {
        enquiryData[key] = value;
    }
    
    // If enquiry date is empty, set it to today
    if (!enquiryData.enquiryDate) {
        enquiryData.enquiryDate = today;
    }
    
    try {
        const response = await fetch('/enquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enquiryData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create enquiry');
        }
        
        const result = await response.json();
        
        // Reset form
        this.reset();
        document.getElementById('enquiryDate').value = today;
        
        // Show success message
        alert('Enquiry submitted successfully!');
        
        // Switch to enquiry list tab
        showTab('enquiry-list');
    } catch (error) {
        console.error('Error creating enquiry:', error);
        alert(error.message || 'Failed to submit enquiry. Please try again.');
    }
});

// Open edit modal with enquiry data
async function openEditModal(id) {
    try {
        const response = await fetch(`/enquiries`);
        const enquiries = await response.json();
        const enquiry = enquiries.find(enq => enq.id === id);
        
        if (!enquiry) {
            throw new Error('Enquiry not found');
        }
        
        // Populate form fields
        document.getElementById('editId').value = enquiry.id;
        document.getElementById('editFullName').value = enquiry.fullName;
        document.getElementById('editEmail').value = enquiry.email;
        document.getElementById('editPhone').value = enquiry.phone;
        document.getElementById('editNationality').value = enquiry.nationality || '';
        document.getElementById('editVisaType').value = enquiry.visaType;
        document.getElementById('editDestinationCountry').value = enquiry.destinationCountry || '';
        document.getElementById('editEnquirySource').value = enquiry.enquirySource;
        document.getElementById('editEnquiryStatus').value = enquiry.enquiryStatus;
        document.getElementById('editAssignedConsultant').value = enquiry.assignedConsultant || '';
        document.getElementById('editFollowUpDate').value = enquiry.followUpDate || '';
        document.getElementById('editPriorityLevel').value = enquiry.priorityLevel;
        document.getElementById('editNotes').value = enquiry.notes || '';
        
        // Show modal
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching enquiry for edit:', error);
        alert('Failed to load enquiry data. Please try again.');
    }
}

// Close modal
function closeModal() {
    editModal.style.display = 'none';
}

// Close modal when clicking on X
closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        closeModal();
    }
});

// Handle edit form submission
editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    
    // Get form data as an object
    const formData = new FormData(this);
    const enquiryData = {};
    
    for (const [key, value] of formData.entries()) {
        if (key !== 'editId') {
            enquiryData[key] = value;
        }
    }
    
    try {
        const response = await fetch(`/enquiries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enquiryData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update enquiry');
        }
        
        // Close modal
        closeModal();
        
        // Refresh enquiries list
        fetchEnquiries();
        
        // Show success message
        alert('Enquiry updated successfully!');
    } catch (error) {
        console.error('Error updating enquiry:', error);
        alert(error.message || 'Failed to update enquiry. Please try again.');
    }
});

// Delete an enquiry
async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry?')) {
        return;
    }
    
    try {
        const response = await fetch(`/enquiries/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete enquiry');
        }
        
        // Refresh enquiries list
        fetchEnquiries();
        
        // Show success message
        alert('Enquiry deleted successfully!');
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert(error.message || 'Failed to delete enquiry. Please try again.');
    }
}

// Initialize: Set up event listeners and load initial data
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for enquiry date
    document.getElementById('enquiryDate').value = today;
    
    // Show the first tab (Add Enquiry) by default
    showTab('add-enquiry');
});