import { useState, useCallback } from 'react';
import { Users, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { Header, Button, Card, CardHeader, CardBody, Badge, Input, Textarea, Select } from '../components/ui';
import { LanguageSelector, TranslationPanel } from '../components/translation';
import { useSessionStore } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';
import { ServiceType, type CreateSessionInput } from '../types';

// =============================================================================
// GREETER DASHBOARD
// =============================================================================

export function GreeterDashboard(): React.ReactElement {
  const { user } = useAuthStore();
  const {
    currentSession,
    createSession,
    selectedLanguage,
    setSelectedLanguage,
    queueStats,
    loadQueueStats,
    addToQueue,
    clearSession,
  } = useSessionStore();

  const [showTranslation, setShowTranslation] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.SIMPLE_TRANSACTION);
  const [notes, setNotes] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Start new session
  const handleStartSession = useCallback(async () => {
    setIsCreatingSession(true);
    
    try {
      const input: CreateSessionInput = {
        preferredLanguage: selectedLanguage,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        serviceType,
      };
      
      await createSession(input);
      setShowTranslation(true);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [selectedLanguage, customerName, customerPhone, serviceType, createSession]);

  // Add to queue
  const handleAddToQueue = useCallback(async (queueType: 'TELLER' | 'CONSULTOR') => {
    try {
      await addToQueue(queueType);
      // Clear form and session after adding to queue
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setShowTranslation(false);
      clearSession();
      // Refresh queue stats
      loadQueueStats();
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  }, [addToQueue, clearSession, loadQueueStats]);

  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      <Header
        title="Welcome Center"
        subtitle="Greeter Dashboard"
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h1 font-bold text-white">
                Good {getGreeting()}, {user?.firstName}
              </h1>
              <p className="text-body text-brand-fog mt-1">
                Help customers get started with instant translation
              </p>
            </div>
            
            {/* Quick stats */}
            <div className="hidden lg:flex items-center gap-4">
              <QuickStat
                icon={<Users className="w-5 h-5" />}
                label="Teller Queue"
                value={queueStats?.tellerQueue.count ?? 0}
                subtext={`~${queueStats?.tellerQueue.estimatedWait ?? 0} min wait`}
              />
              <QuickStat
                icon={<Clock className="w-5 h-5" />}
                label="Consultor Queue"
                value={queueStats?.consultorQueue.count ?? 0}
                subtext={`~${queueStats?.consultorQueue.estimatedWait ?? 0} min wait`}
              />
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Language Selection */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Select Customer Language"
                subtitle="Choose the language your customer speaks"
              />
              <CardBody>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                />

                {/* Start translation button */}
                <div className="mt-6 flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartSession}
                    isLoading={isCreatingSession}
                    leftIcon={<MessageSquare className="w-5 h-5" />}
                  >
                    Start Translation Session
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Customer Info Form */}
            <Card>
              <CardHeader
                title="Customer Information"
                subtitle="Optional details"
              />
              <CardBody className="space-y-4">
                <Input
                  label="Customer Name"
                  placeholder="Enter name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                
                <Input
                  label="Phone Number"
                  placeholder="(207) 555-0123"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />

                <Select
                  label="Service Type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  options={[
                    { value: ServiceType.SIMPLE_TRANSACTION, label: 'Simple Transaction' },
                    { value: ServiceType.COMPLEX_SERVICE, label: 'Complex Service' },
                    { value: ServiceType.URGENT, label: 'Urgent' },
                  ]}
                />

                <Textarea
                  label="Notes"
                  placeholder="Any relevant notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardBody>
            </Card>
          </div>

          {/* Queue Assignment Section - shows when session is active */}
          {currentSession && (
            <Card className="animate-fade-in">
              <CardHeader
                title="Route Customer"
                subtitle="Send to appropriate queue"
              />
              <CardBody>
                <div className="grid md:grid-cols-2 gap-4">
                  <QueueCard
                    title="Teller Queue"
                    description="Simple transactions, deposits, withdrawals"
                    count={queueStats?.tellerQueue.count ?? 0}
                    waitTime={queueStats?.tellerQueue.estimatedWait ?? 0}
                    onClick={() => handleAddToQueue('TELLER')}
                    color="#3B82F6"
                  />
                  <QueueCard
                    title="Consultor Queue"
                    description="Account services, loans, complex inquiries"
                    count={queueStats?.consultorQueue.count ?? 0}
                    waitTime={queueStats?.consultorQueue.estimatedWait ?? 0}
                    onClick={() => handleAddToQueue('CONSULTOR')}
                    color="#8B5CF6"
                  />
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </main>

      {/* Translation Panel */}
      {showTranslation && currentSession && (
        <TranslationPanel
          sessionId={currentSession.id}
          customerLanguage={selectedLanguage}
          onClose={() => setShowTranslation(false)}
          onLanguageChange={setSelectedLanguage}
        />
      )}
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
}

function QuickStat({ icon, label, value, subtext }: QuickStatProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-deep-ocean border border-brand-harbor/30">
      <div className="w-10 h-10 rounded-lg bg-brand-steel-blue flex items-center justify-center text-brand-fog">
        {icon}
      </div>
      <div>
        <p className="text-caption text-brand-fog">{label}</p>
        <p className="text-body-lg font-semibold text-white">{value}</p>
        <p className="text-caption text-brand-harbor">{subtext}</p>
      </div>
    </div>
  );
}

interface QueueCardProps {
  title: string;
  description: string;
  count: number;
  waitTime: number;
  onClick: () => void;
  color: string;
}

function QueueCard({ title, description, count, waitTime, onClick, color }: QueueCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl text-left transition-all duration-200',
        'bg-brand-deep-ocean border-2 border-brand-harbor/30',
        'hover:border-current hover:-translate-y-1 hover:shadow-lg',
        'group'
      )}
      style={{ 
        '--tw-border-opacity': 0.5,
        color,
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-body-lg font-semibold text-white">{title}</h3>
          <p className="text-body-sm text-brand-fog mt-1">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-brand-harbor group-hover:text-current transition-colors" />
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="default">
          {count} waiting
        </Badge>
        <span className="text-caption text-brand-fog">
          ~{waitTime} min estimated
        </span>
      </div>
    </button>
  );
}

export default GreeterDashboard;
