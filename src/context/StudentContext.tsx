import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Student } from '@/types';
import {
  listStudents,
  addStudent as addStudentRepo,
  getActiveStudentId,
  setActiveStudentId,
} from '@/db/repository';

interface StudentContextValue {
  students: Student[];
  activeStudentId: string | null;
  activeStudent: Student | null;
  switchStudent: (id: string) => Promise<void>;
  createStudent: (name: string) => Promise<Student>;
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

  const activeStudent = students.find((s) => s.id === activeStudentId) ?? null;

  return (
    <StudentContext.Provider
      value={{ students, activeStudentId, activeStudent, switchStudent, createStudent, refreshStudents }}
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
