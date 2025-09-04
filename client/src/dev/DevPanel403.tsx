import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Error403Event {
  url: string;
  status: number;
  method: string;
  bodyExcerpt?: string;
  why?: string;
  origin: string;
  timestamp: string;
}

interface Server403Record {
  ts: string;
  method: string;
  path: string;
  origin: string | null;
  referer: string | null;
  host: string | null;
  ip: string | null;
  userAgent: string | null;
  why: string;
}

interface CorsEchoResponse {
  method: string;
  path: string;
  origin: string | null;
  referer: string | null;
  host: string | null;
  resolvedOrigin: string | null;
  allowed: boolean;
  matched: string | null;
}

export function DevPanel403() {
  const [events, setEvents] = useState<Error403Event[]>([]);
  const [serverRecords, setServerRecords] = useState<Server403Record[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [corsEcho, setCorsEcho] = useState<CorsEchoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle403Event = (event: CustomEvent) => {
      const detail = event.detail as Error403Event;
      setEvents(prev => [{
        ...detail,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    window.addEventListener('blossom:403', handle403Event as EventListener);
    return () => window.removeEventListener('blossom:403', handle403Event as EventListener);
  }, []);

  const fetchServerRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/403s');
      const data = await response.json();
      setServerRecords(data.records || []);
    } catch (error) {
      console.error('Failed to fetch server 403 records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorsEcho = async () => {
    try {
      const response = await fetch('/api/cors/echo');
      const data = await response.json();
      setCorsEcho(data);
    } catch (error) {
      console.error('Failed to fetch CORS echo:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getWhyColor = (why?: string) => {
    switch (why) {
      case 'cors': return 'bg-red-500';
      case 'payload': return 'bg-yellow-500';
      case 'auth': return 'bg-purple-500';
      case 'sse': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!import.meta.env.VITE_DEBUG_CHAT) {
    return null;
  }

  return (
    <>
      {/* Floating pill */}
      {events.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg"
            size="sm"
          >
            403 x{events.length} — View
          </Button>
        </div>
      )}

      {/* Dev panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">403 Debug Panel</CardTitle>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={fetchServerRecords}
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? 'Loading...' : 'Fetch Server 403 Log'}
                  </Button>
                  <Button
                    onClick={fetchCorsEcho}
                    variant="outline"
                    size="sm"
                  >
                    Open CORS Echo
                  </Button>
                </div>

                {/* CORS Echo */}
                {corsEcho && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">CORS Echo Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(corsEcho, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Client Events */}
                {events.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Client 403 Events ({events.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {events.map((event, index) => (
                            <div key={index} className="border rounded p-2 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${getWhyColor(event.why)} text-white`}>
                                  {event.why || 'unknown'}
                                </Badge>
                                <span className="font-mono">{event.method}</span>
                                <span className="text-gray-500">{formatTime(event.timestamp)}</span>
                              </div>
                              <div className="font-mono text-gray-600">{event.url}</div>
                              {event.bodyExcerpt && (
                                <div className="text-gray-500 mt-1">{event.bodyExcerpt}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Server Records */}
                {serverRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Server 403 Records ({serverRecords.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {serverRecords.map((record, index) => (
                            <div key={index} className="border rounded p-2 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${getWhyColor(record.why)} text-white`}>
                                  {record.why}
                                </Badge>
                                <span className="font-mono">{record.method}</span>
                                <span className="text-gray-500">{formatTime(record.ts)}</span>
                              </div>
                              <div className="font-mono text-gray-600">{record.path}</div>
                              <div className="text-gray-500">
                                Origin: {record.origin || 'none'} | IP: {record.ip || 'none'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}




