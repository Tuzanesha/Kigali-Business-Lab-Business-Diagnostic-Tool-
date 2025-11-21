'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Plus, Calendar, Check } from 'lucide-react';
import './action-plan.css';
import Link from 'next/link';
import { actionItemApi } from '@/lib/api';

const PriorityTag = ({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
  const styles = {
    HIGH: 'priority-tag priority-high',
    MEDIUM: 'priority-tag priority-medium',
    LOW: 'priority-tag priority-low',
  };
  return <span className={styles[priority]}>{priority}</span>;
};

// Helper function to generate a consistent color from initials
const getColorFromInitials = (initials: string): string => {
  const colors = ['#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#10b981', '#f59e0b'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserAvatar = ({ initials }: { initials: string }) => {
  const displayInitials = initials.length > 2 ? initials.substring(0, 2) : initials;
  return (
    <div 
      className="user-avatar" 
      style={{ 
        backgroundColor: getColorFromInitials(displayInitials),
        color: '#fff',
        fontWeight: '600',
        fontSize: '0.75rem'
      }}
      title={initials.length > 2 ? initials : ''}
    >
      {displayInitials.toUpperCase()}
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
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { 
          toast.dismiss(id); 
          toast.error('Please log in to view action items');
          return; 
        }
        const board = await actionItemApi.getBoard(accessToken);
        setColumns({
          todo: (board?.todo || []) as Task[],
          inprogress: (board?.inprogress || []) as Task[],
          completed: (board?.completed || []) as Task[],
        });
        toast.success('Action plan loaded', { id, duration: 2000 });
      } catch (e:any) {
        toast.error(e?.message || 'Failed to load action plan', { id, duration: 4000 });
      }
    };
    load();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // Don't do anything if dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const sourceColumn = [...newColumns[source.droppableId as keyof Columns]];
      const [removed] = sourceColumn.splice(source.index, 1);
      
      if (source.droppableId === destination.droppableId) {
        // Same column reordering
        sourceColumn.splice(destination.index, 0, removed);
        newColumns[source.droppableId as keyof Columns] = sourceColumn;
      } else {
        // Moving between columns
        const destColumn = [...newColumns[destination.droppableId as keyof Columns]];
        destColumn.splice(destination.index, 0, removed);
        newColumns[source.droppableId as keyof Columns] = sourceColumn;
        newColumns[destination.droppableId as keyof Columns] = destColumn;
      }

      // Update backend
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const items = Object.entries(newColumns).flatMap(([status, tasks]) =>
          (tasks as Task[]).map((task, index) => ({
            id: task.id,
            status: status as 'todo' | 'inprogress' | 'completed',
            order: index
          }))
        );
        
        actionItemApi.bulkMove(accessToken, items).catch(error => {
          console.error('Failed to update task positions:', error);
          toast.error('Failed to update task positions');
        });
      }

      return newColumns;
    });

    if (source.droppableId !== destination.droppableId) {
      const task = columns[source.droppableId as keyof Columns][source.index];
      if (task) {
        toast.success(`Moved "${task.title}" to ${columnTitles[destination.droppableId as keyof Columns]}`, { duration: 2500 });
      }
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