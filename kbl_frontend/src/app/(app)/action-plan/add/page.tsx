'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import './add-task.css';
import { actionItemApi, teamApi, enterpriseApi, getAccessToken } from '../../../../lib/api'

type TeamMember = { id: number; email: string; role: 'ADMIN'|'MANAGER'|'MEMBER'; status: string; enterprise: number };

const priorities = ['HIGH', 'MEDIUM', 'LOW'];

export default function AddNewTaskPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [enterpriseId, setEnterpriseId] = useState<number|null>(null);
  const [formData, setFormData] = useState({
    title: '',
    source: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    const load = async () => {
      const id = toast.loading('Loading team...');
      try {
        const access = getAccessToken();
        if (!access) { toast.dismiss(id); return; }
        const ep = await enterpriseApi.getProfile(access);
        setEnterpriseId(ep?.id || null);
        const list = await teamApi.list(access);
        const items: TeamMember[] = Array.isArray(list?.results) ? list.results : (Array.isArray(list) ? list : []);
        // Filter to current enterprise if available
        const filtered = ep?.id ? items.filter(m => Number(m.enterprise) === Number(ep.id)) : items;
        setTeam(filtered);
        toast.success('Team loaded', { id, duration: 1200 });
      } catch (e:any) {
        toast.error(e?.message || 'Failed to load team', { id, duration: 1500 });
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.dueDate || !formData.assignedTo) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const id = toast.loading('Creating new task...');
    try {
      const access = getAccessToken();
      if (!access) { toast.dismiss(id); router.push('/login'); return; }
      await actionItemApi.create(access, {
        title: formData.title,
        source: formData.source,
        priority: formData.priority as 'HIGH'|'MEDIUM'|'LOW',
        due_date: formData.dueDate,
        assigned_to: formData.assignedTo,
        status: 'todo',
        ...(enterpriseId ? { enterprise: enterpriseId } : {}),
      });
      toast.success('Task created successfully!', { id });
      router.push('/action-plan');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create task.', { id });
    }
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
              {team.map(m => (
                <option key={m.id} value={m.email}>{m.email}</option>
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