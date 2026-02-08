
import Dexie, { Table } from 'dexie';
import { Document, Topic, Subtopic, MCQSet, Attempt, AppSettings, ExamTemplate, MCQStats, AuditLogEntry } from '../../types';

export class FSPDFMakerDB extends Dexie {
  documents!: Table<Document, string>;
  topics!: Table<Topic, string>;
  subtopics!: Table<Subtopic, string>;
  mcqSets!: Table<MCQSet, string>;
  attempts!: Table<Attempt, string>;
  settings!: Table<AppSettings, string>;
  examTemplates!: Table<ExamTemplate, string>;
  mcqStats!: Table<MCQStats, string>;
  auditLogs!: Table<AuditLogEntry, string>;

  constructor() {
    super('FSPDFMakerDB');
    
    // Schema definition
    // Version 1
    (this as any).version(1).stores({
      documents: '&id, title, updatedAt',
      topics: '&id, name, order',
      subtopics: '&id, topicId, name',
      mcqSets: '&id, subtopicId, name, updatedAt',
      attempts: '&id, setId, mode, completedAt',
      settings: '&id',
      examTemplates: '&id, name, usedCount',
      mcqStats: '&id, mcqId, setId, accuracy'
    });

    // Version 2: Add auditLogs table and update existing stores if needed
    (this as any).version(2).stores({
      documents: '&id, title, updatedAt, isArchived',
      topics: '&id, name, order',
      subtopics: '&id, topicId, name',
      mcqSets: '&id, subtopicId, name, updatedAt, isArchived',
      attempts: '&id, setId, mode, completedAt',
      settings: '&id',
      examTemplates: '&id, name, usedCount',
      mcqStats: '&id, mcqId, setId, accuracy',
      auditLogs: '++id, action, entity, timestamp'
    });

    // Version 3: Fix auditLogs schema to support string IDs (UUIDs)
    // Changing from ++id (auto-inc) to id (string/explicit)
    (this as any).version(3).stores({
      auditLogs: 'id, action, entity, timestamp'
    });
  }
}

export const db = new FSPDFMakerDB();
