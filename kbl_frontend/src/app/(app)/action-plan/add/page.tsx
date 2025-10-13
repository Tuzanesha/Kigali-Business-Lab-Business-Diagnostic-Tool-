'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import './add-task.css';

const users = [
  { id: 'JD', name: 'John Doe' },
  { id: 'SM', name: 'Sarah Miller' },
  { id: 'RJ', name: 'Robert Johnson' },
  { id: 'LK', name: 'Laura King' },
  { id: 'HR', name: 'Henry Roberts' },
];

const priorities = ['HIGH', 'MEDIUM', 'LOW'];

export default function AddNewTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    source: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.dueDate || !formData.assignedTo) {
        toast.error('Please fill in all required fields.');
        return;
    }

    const createTaskPromise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 1500);
    });

    toast.promise(createTaskPromise, {
        loading: 'Creating new task...',
        success: 'Task created successfully!',
        error: 'Failed to create task.',
    });

    createTaskPromise.then(() => {
        setTimeout(() => {
            router.push('/action-plan');
        }, 500);
    });
  };

  return (
    <div className="add-task-page">
      <header className="page-header">
        <h1 className="page-title">ADD NEW TASK</h1>
      </header>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group form-group-full">
            <label htmlFor="title" className="form-label">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Develop a formal cashflow report"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="source" className="form-label">Source Assessment</label>
            <input
              type="text"
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., From: Financials Assessment"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo" className="form-label">Assigned To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Select a team member</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-group">
              {priorities.map(priority => (
                <div key={priority} className="priority-option">
                  <input
                    type="radio"
                    id={`priority-${priority}`}
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor={`priority-${priority}`}
                    className={`priority-label-${priority.toLowerCase()}`}
                  >
                    {priority}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Link href="/action-plan" className="button button-secondary">
              Cancel
            </Link>
            <button type="submit" className="button button-primary">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}