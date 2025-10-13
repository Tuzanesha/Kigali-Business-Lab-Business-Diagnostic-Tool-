'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Plus, Calendar, Check } from 'lucide-react';
import './action-plan.css';
import Link from 'next/link';

const PriorityTag = ({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
  const styles = {
    HIGH: 'priority-tag priority-high',
    MEDIUM: 'priority-tag priority-medium',
    LOW: 'priority-tag priority-low',
  };
  return <span className={styles[priority]}>{priority}</span>;
};

const UserAvatar = ({ initials }: { initials: string }) => {
  const colors = {
    JD: '#3b82f6', SM: '#ef4444', RJ: '#8b5cf6',
    LK: '#14b8a6', HR: '#f97316'
  };
  const colorKey = initials as keyof typeof colors;
  return (
    <div className="user-avatar" style={{ backgroundColor: colors[colorKey] || '#64748b' }}>
      {initials}
    </div>
  );
};

const initialTasks = {
  todo: [
    { id: 'task-1', title: 'Develop a formal cashflow report', source: 'From: Financials Assessment', date: 'Mar 20, 2025', user: 'JD', priority: 'HIGH' },
    { id: 'task-2', title: 'Implement monthly all-hands meetings', source: 'From: Leadership Assessment', date: 'Mar 15, 2025', user: 'SM', priority: 'HIGH' },
    { id: 'task-3', title: 'Create standardized sales documentation', source: 'From: Sales Assessment', date: 'Apr 1, 2025', user: 'RJ', priority: 'MEDIUM' },
    { id: 'task-4', title: 'Establish customer complaint resolution process', source: 'From: Service Assessment', date: 'Mar 25, 2025', user: 'LK', priority: 'MEDIUM' },
    { id: 'task-5', title: 'Set up innovation program framework', source: 'From: Leadership Assessment', date: 'Apr 15, 2025', user: 'JD', priority: 'LOW' },
  ],
  inprogress: [
    { id: 'task-6', title: 'Improve customer service response times', source: 'From: Service Assessment', date: 'Mar 18, 2025', user: 'LK', priority: 'HIGH' },
    { id: 'task-7', title: 'Update job descriptions for all positions', source: 'From: Organisation Assessment', date: 'Mar 30, 2025', user: 'HR', priority: 'MEDIUM' },
  ],
  completed: [
    { id: 'task-8', title: 'Conduct customer satisfaction survey', source: 'From: Product Assessment', date: 'Mar 10, 2025', user: 'LK', priority: 'MEDIUM' },
    { id: 'task-9', title: 'Implement digital marketing ROI tracking', source: 'From: Marketing Assessment', date: 'Mar 5, 2025', user: 'JD', priority: 'LOW' },
  ],
};

const columnTitles = {
  todo: 'TO DO',
  inprogress: 'IN PROGRESS',
  completed: 'COMPLETED',
};

export default function ActionPlanPage() {
  const [columns, setColumns] = useState(initialTasks);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColId = source.droppableId as keyof typeof columns;
    const destColId = destination.droppableId as keyof typeof columns;
    
    if (sourceColId === destColId && source.index === destination.index) {
        return;
    }

    const sourceCol = [...columns[sourceColId]];
    const destCol = sourceColId === destColId ? sourceCol : [...columns[destColId]];
    
    const [removed] = sourceCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, removed);

    setColumns({
      ...columns,
      [sourceColId]: sourceCol,
      [destColId]: destCol,
    });

    if (sourceColId !== destColId) {
        toast.success(`Moved "${removed.title}" to ${columnTitles[destColId]}`);
    }
  };

  return (
    <div className="action-plan-page">
      <header className="page-header">
        <h1 className="page-title">ACTION PLAN</h1>
        <Link href="/action-plan/add" className="add-task-button">
          <Plus size={18} />
          <span>Add New Task</span>
        </Link>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="column-header">
                    <h2 className="column-title">{columnTitles[columnId as keyof typeof columnTitles]}</h2>
                    <span className="task-count">{tasks.length}</span>
                  </div>
                  <div className="task-list">
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            className="task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <PriorityTag priority={task.priority as 'HIGH' | 'MEDIUM' | 'LOW'} />
                            <h3 className="card-title">{task.title}</h3>
                            <p className="card-source">{task.source}</p>
                            <div className="card-footer">
                              <div className="card-date">
                                <Calendar size={14} />
                                <span>{task.date}</span>
                              </div>
                              {columnId === 'completed' ? (
                                <div className="completed-icon"><Check size={16} /></div>
                              ) : (
                                <UserAvatar initials={task.user} />
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}