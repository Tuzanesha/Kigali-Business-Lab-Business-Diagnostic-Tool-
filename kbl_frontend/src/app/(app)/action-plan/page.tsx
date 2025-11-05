'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Plus, Calendar, Check } from 'lucide-react';
import './action-plan.css';
import Link from 'next/link';
import { apiActionBoard, apiActionBulkMove } from '../../../lib/api';

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

type Task = { id: number; title: string; source: string; date: string; user: string; priority: 'HIGH'|'MEDIUM'|'LOW' };
type Columns = { todo: Task[]; inprogress: Task[]; completed: Task[] };

const columnTitles = {
  todo: 'TO DO',
  inprogress: 'IN PROGRESS',
  completed: 'COMPLETED',
} as const;

export default function ActionPlanPage() {
  const [columns, setColumns] = useState<Columns>({ todo: [], inprogress: [], completed: [] });

  useEffect(() => {
    const load = async () => {
      const id = toast.loading('Loading action plan...');
      try {
        const access = localStorage.getItem('access');
        if (!access) { toast.dismiss(id); return; }
        const data = await apiActionBoard(access);
        setColumns({
          todo: (data?.todo || []) as Task[],
          inprogress: (data?.inprogress || []) as Task[],
          completed: (data?.completed || []) as Task[],
        });
        toast.success('Action plan loaded', { id, duration: 2000 });
      } catch (e:any) {
        toast.error(e?.message || 'Failed to load action plan', { id, duration: 4000 });
      }
    };
    load();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColId = source.droppableId as keyof Columns;
    const destColId = destination.droppableId as keyof Columns;
    
    if (sourceColId === destColId && source.index === destination.index) {
        return;
    }

    const sourceCol = [...columns[sourceColId]] as Task[];
    const destCol = sourceColId === destColId ? sourceCol : [...columns[destColId]] as Task[];
    
    const [removed] = sourceCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, removed);

    setColumns({
      ...columns,
      [sourceColId]: sourceCol,
      [destColId]: destCol,
    });

    // Persist new ordering to backend
    try {
      const access = localStorage.getItem('access');
      if (access) {
        const build = (col: keyof Columns) => (columns[col] as Task[]).map((t, idx) => ({ id: Number(t.id), status: col, order: idx }));
        const next = {
          ...columns,
          [sourceColId]: sourceCol,
          [destColId]: destCol,
        } as Columns;
        const items = (['todo','inprogress','completed'] as Array<keyof Columns>)
          .flatMap((c) => (next[c] as Task[]).map((t, idx) => ({ id: Number(t.id), status: c, order: idx })));
        await apiActionBulkMove(access, items);
      }
      if (sourceColId !== destColId) {
        toast.success(`Moved "${removed.title}" to ${columnTitles[destColId] as 'TO DO'|'IN PROGRESS'|'COMPLETED'}`, { duration: 2500 });
      }
    } catch (e:any) {
      toast.error(e?.message || 'Failed to save new order', { duration: 4000 });
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
          {(Object.entries(columns) as Array<[keyof Columns, Task[]]>).map(([columnId, tasks]) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="column-header">
                    <h2 className="column-title">{columnTitles[columnId]}</h2>
                    <span className="task-count">{tasks.length}</span>
                  </div>
                  <div className="task-list">
                    {tasks.map((task: Task, index: number) => (
                      <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
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