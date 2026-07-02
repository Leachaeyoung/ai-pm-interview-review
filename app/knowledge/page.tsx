import { getKnowledgeFeed } from '@/lib/data';
import KnowledgeClient from './KnowledgeClient';

export default function KnowledgePage() {
  const concepts = getKnowledgeFeed();
  return <KnowledgeClient initialConcepts={concepts} />;
}
