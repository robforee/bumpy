import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiSettings, FiPlusCircle, FiChevronRight } from 'react-icons/fi';
import { fetchTopicsByCategory, updateTopic } from '@/src/lib/topicFirebaseOperations';
import AddTopicModal from './AddTopicModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { devConfig } from '@/src/config/devConfig';

const markdownStyles = `
  .markdown-content ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  .markdown-content ol {
    list-style-type: decimal;
    padding-left: 20px;
  }
  .markdown-content li {
    margin-bottom: 5px;
  }
`;

const TopicListTable = ({ parentId, topic_type, rowHeight }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedTopicIds, setExpandedTopicIds] = useState(new Set());

  const loadTopics = async () => {
    try {
      setLoading(true);
      const fetchedTopics = await fetchTopicsByCategory([topic_type], parentId);
      const sortedTopics = fetchedTopics.sort((a, b) => a.title.localeCompare(b.title));
      setTopics(sortedTopics);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching topics:", err);
      setError("Failed to load topics. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
    const savedExpandedIds = localStorage.getItem(`expandedTopics_${parentId}_${topic_type}`);
    if (savedExpandedIds) {
      setExpandedTopicIds(new Set(JSON.parse(savedExpandedIds)));
    }
  }, [parentId, topic_type]);

  const toggleTopicExpansion = (topicId) => {
    setExpandedTopicIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      localStorage.setItem(`expandedTopics_${parentId}_${topic_type}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleAddTopic = () => {
    setIsAddModalOpen(true);
  };

  const handleTopicAdded = () => {
    loadTopics();
    setIsAddModalOpen(false);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
    setHasChanges(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTopic(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSaveTopic = async () => {
    try {
      if (!editingTopic || !editingTopic.id) {
        throw new Error("Invalid topic data");
      }
      const updatedTopic = await updateTopic(editingTopic.id, {
        title: editingTopic.title,
        subtitle: editingTopic.subtitle,
        text: editingTopic.text
      });
      setEditModalOpen(false);
      setTopics(prevTopics => 
        prevTopics.map(t => t.id === updatedTopic.id ? {...t, ...updatedTopic} : t)
      );
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
    <style jsx global>{markdownStyles}</style>
      {topics.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <button
            onClick={handleAddTopic}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
          >
            <FiPlusCircle size={48} />
          </button>
        </div>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className={`${rowHeight} px-6 text-left`}>
                <div className="flex items-center">
                  <button
                    onClick={handleAddTopic}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiPlusCircle size={18} />
                  </button>
                  Title
                </div>
              </th>
              <th className={`${rowHeight} px-6 text-left`}>Type</th>
              <th className={`${rowHeight} px-6 text-left`}>Last Updated</th>
              <th className={`${rowHeight} px-6 text-left`}>Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {topics.slice(0, 100).map((topic) => (
              <React.Fragment key={topic.id}>
                <tr className="border-b border-gray-200 hover:bg-gray-100">
                  <td className={`${rowHeight} px-6 text-left whitespace-nowrap`}>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleEditTopic(topic)}
                        className="mr-2 text-gray-500 hover:text-gray-700"
                      >
                        <FiSettings size={14} />
                      </button>
                      <Link href={`/topics/${topic.id}`} className="font-medium">
                        {topic.title}
                      </Link>
                    </div>
                  </td>
                  <td className={`${rowHeight} px-6 text-left`}>{topic.topic_type}</td>
                  <td className={`${rowHeight} px-6 text-left`}>
                    {topic.updated_at instanceof Date ? topic.updated_at.toLocaleString() : 'N/A'}
                  </td>
                  <td className={`${rowHeight} px-6 text-left`}>
                    <button onClick={() => toggleTopicExpansion(topic.id)}>
                      <FiChevronRight size={14} className={expandedTopicIds.has(topic.id) ? 'transform rotate-90' : ''} />
                    </button>
                  </td>
                </tr>
                {expandedTopicIds.has(topic.id) && (
                  <tr>
                    <td colSpan="4" className="px-6 py-2">
                      <div className="max-w-full overflow-x-auto px-4">
                        <ReactMarkdown className={`markdown-content text-${devConfig.topicList.topicDetailFontSize} text-black font-black`}>
                          {topic.text}
                        </ReactMarkdown>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <AddTopicModal
          onClose={() => setIsAddModalOpen(false)}
          parentId={parentId}
          topicType={topic_type}
          onTopicAdded={handleTopicAdded}
        />
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen} hasChanges={hasChanges}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              name="title"
              value={editingTopic?.title || ''}
              onChange={handleEditChange}
              placeholder="Title"
            />
            <Input
              name="subtitle"
              value={editingTopic?.subtitle || ''}
              onChange={handleEditChange}
              placeholder="Subtitle"
            />
            <Textarea
              name="text"
              value={editingTopic?.text || ''}
              onChange={handleEditChange}
              placeholder="Text"
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleSaveTopic}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicListTable;