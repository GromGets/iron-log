import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Student } from '@/types';
import {
  listStudents,
  addStudent as addStudentRepo,
  deleteStudent as deleteStudentRepo,
  getActiveStudentId,
  setActiveStudentId,
} from '@/db/repository';

interface StudentContextValue {
  students: Student[];
  activeStudentId: string | null;
  activeStudent: Student | null;
  switchStudent: (id: string) => Promise<void>;
  createStudent: (name: string) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudentId, setActiveStudentIdState] = useState<string | null>(null);

  const refreshStudents = useCallback(async () => {
    setStudents(await listStudents());
  }, []);

  useEffect(() => {
    (async () => {
      await refreshStudents();
      setActiveStudentIdState(await getActiveStudentId());
    })();
  }, [refreshStudents]);

  const switchStudent = useCallback(async (id: string) => {
    await setActiveStudentId(id);
    setActiveStudentIdState(id);
  }, []);

  // Creating a student also makes them the active one — a trainer adding a
  // new person almost always wants to start logging for them right away.
  const createStudent = useCallback(
    async (name: string) => {
      const student = await addStudentRepo(name);
      setStudents((prev) => [...prev, student]);
      await switchStudent(student.id);
      return student;
    },
    [switchStudent]
  );

  // If the deleted person was the active one, fall back to whoever's left —
  // there must always be at least one active student for the rest of the
  // app's queries to make sense.
  const deleteStudent = useCallback(
    async (id: string) => {
      await deleteStudentRepo(id);
      const remaining = students.filter((s) => s.id !== id);
      setStudents(remaining);
      if (activeStudentId === id && remaining[0]) {
        await switchStudent(remaining[0].id);
      }
    },
    [students, activeStudentId, switchStudent]
  );

  const activeStudent = students.find((s) => s.id === activeStudentId) ?? null;

  return (
    <StudentContext.Provider
      value={{
        students,
        activeStudentId,
        activeStudent,
        switchStudent,
        createStudent,
        deleteStudent,
        refreshStudents,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useActiveStudent(): StudentContextValue {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useActiveStudent must be used within a StudentProvider');
  return ctx;
}
