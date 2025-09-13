import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { withApiBase } from '../../services/config';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

const AdminEventManagementView: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: ''
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
  const response = await fetch(withApiBase('/api/events'));
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
  const response = await fetch(withApiBase('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, isActive: true, isFeatured: false })
      });
      const event = await response.json();
      setEvents([event, ...events]);
      setNewEvent({ title: '', description: '', location: '', date: '', time: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const toggleFeatured = async (eventId: string, isFeatured: boolean) => {
    try {
  await fetch(withApiBase(`/api/events/${eventId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !isFeatured })
      });
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, isFeatured: !isFeatured } : event
      ));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const toggleActive = async (eventId: string, isActive: boolean) => {
    try {
  await fetch(withApiBase(`/api/events/${eventId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, isActive: !isActive } : event
      ));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
  await fetch(withApiBase(`/api/events/${eventId}`), {
        method: 'DELETE'
      });
      setEvents(events.filter(event => event._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Event Management</h1>
      
      <div style={cardStyle}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: Colors.text }}>Events ({events.length})</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: Colors.primary }}
          >
            {showForm ? 'Cancel' : 'Add New Event'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: Colors.cardBorder }}>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="text"
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
            </div>
            <textarea
              placeholder="Event Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="w-full mt-2 px-3 py-2 border rounded"
              style={{ borderColor: Colors.cardBorder }}
              rows={3}
            />
            <button
              onClick={createEvent}
              className="mt-2 px-4 py-2 text-sm font-semibold rounded text-white"
              style={{ backgroundColor: Colors.secondary }}
            >
              Create Event
            </button>
          </div>
        )}

        <div className="space-y-4">
          {events.length === 0 ? (
            <p style={{ color: Colors.text_secondary }}>No events found. Add your first event!</p>
          ) : (
            events.map(event => (
              <div key={event._id} className="border rounded-lg p-4" style={{ borderColor: Colors.cardBorder }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: Colors.text }}>{event.title}</h3>
                      {event.isFeatured && (
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${Colors.highlight}20`, color: Colors.highlight }}>
                          Featured
                        </span>
                      )}
                      {!event.isActive && (
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${Colors.accentError}20`, color: Colors.accentError }}>
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: Colors.text_secondary }}>{event.description}</p>
                    <p className="text-sm" style={{ color: Colors.text }}>📍 {event.location}</p>
                    <p className="text-sm" style={{ color: Colors.text }}>📅 {event.date} at {event.time}</p>
                    <p className="text-xs" style={{ color: Colors.text_secondary }}>
                      Created: {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleFeatured(event._id, event.isFeatured)}
                      className="text-xs px-3 py-1 rounded"
                      style={{
                        color: event.isFeatured ? Colors.accentWarning : Colors.highlight,
                        backgroundColor: event.isFeatured ? `${Colors.accentWarning}20` : `${Colors.highlight}20`
                      }}
                    >
                      {event.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => toggleActive(event._id, event.isActive)}
                      className="text-xs px-3 py-1 rounded"
                      style={{
                        color: event.isActive ? Colors.accentWarning : Colors.accentSuccess,
                        backgroundColor: event.isActive ? `${Colors.accentWarning}20` : `${Colors.accentSuccess}20`
                      }}
                    >
                      {event.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => deleteEvent(event._id)}
                      className="text-xs px-3 py-1 rounded"
                      style={{ color: Colors.accentError, backgroundColor: `${Colors.accentError}20` }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEventManagementView;