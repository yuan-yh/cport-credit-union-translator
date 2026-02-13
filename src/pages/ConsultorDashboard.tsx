import { useState, useEffect, useCallback } from 'react';
import { Bell, User, Clock, MessageSquare, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import { formatRelativeTime, getInitials } from '../lib/utils';
import { Header, Button, Card, CardHeader, CardBody, Badge, Avatar, Textarea } from '../components/ui';
import { TranslationPanel, CompactLanguageSelector } from '../components/translation';
import { useSessionStore } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { SUPPORTED_LANGUAGES, QueueStatus, type QueueItemWithSession, type LanguageCode } from '../types';

// =============================================================================
// CONSULTOR DASHBOARD
// =============================================================================

export function ConsultorDashboard(): React.ReactElement {
  const { user } = useAuthStore();
  const { currentSession, loadSession, clearSession, selectedLanguage, setSelectedLanguage, translations } = useSessionStore();
  
  const [queueItems, setQueueItems] = useState<QueueItemWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeItem, setActiveItem] = useState<QueueItemWithSession | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  // Load queue on mount
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const items = await api.getQueue('CONSULTOR');
      setQueueItems(items);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Call next customer
  const handleCallNext = useCallback(async () => {
    try {
      const item = await api.callNextInQueue('CONSULTOR');
      if (item) {
        setActiveItem(item);
        await loadSession(item.sessionId);
        setSelectedLanguage(item.session.preferredLanguage as LanguageCode);
        loadQueue();
      }
    } catch (error) {
      console.error('Failed to call next:', error);
    }
  }, [loadSession, setSelectedLanguage]);

  // Accept customer
  const handleAcceptCustomer = useCallback(async () => {
    if (!activeItem) return;
    
    try {
      await api.updateQueueItem(activeItem.id, { 
        status: QueueStatus.IN_SERVICE,
        assignedBankerId: user?.id,
      });
      setShowTranslation(true);
      loadQueue();
    } catch (error) {
      console.error('Failed to accept customer:', error);
    }
  }, [activeItem, user?.id]);

  // Mark as no-show
  const handleNoShow = useCallback(async () => {
    if (!activeItem) return;
    
    try {
      await api.updateQueueItem(activeItem.id, { status: QueueStatus.NO_SHOW });
      setActiveItem(null);
      clearSession();
      loadQueue();
    } catch (error) {
      console.error('Failed to mark no-show:', error);
    }
  }, [activeItem, clearSession]);

  // Complete consultation
  const handleComplete = useCallback(async () => {
    if (!activeItem) return;
    
    try {
      await api.updateQueueItem(activeItem.id, { status: QueueStatus.COMPLETED });
      setActiveItem(null);
      setShowTranslation(false);
      setSessionNotes('');
      clearSession();
      loadQueue();
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  }, [activeItem, clearSession]);

  const waitingItems = queueItems.filter(item => item.status === 'WAITING');
  const calledItem = queueItems.find(item => 
    item.status === 'CALLED' && item.assignedBankerId === user?.id
  );
  const inServiceItem = queueItems.find(item => 
    item.status === 'IN_SERVICE' && item.assignedBankerId === user?.id
  );

  useEffect(() => {
    if (inServiceItem) {
      setActiveItem(inServiceItem);
      setShowTranslation(true);
    } else if (calledItem) {
      setActiveItem(calledItem);
    }
  }, [inServiceItem, calledItem]);

  return (
    <div className="min-h-screen bg-brand-midnight flex flex-col">
      <Header
        title="Consultation Desk"
        subtitle={`Consultant: ${user?.firstName} ${user?.lastName}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={activeItem ? 'info' : 'default'}>
              {activeItem ? 'In Consultation' : 'Available'}
            </Badge>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Consultation Area */}
            <div className="lg:col-span-2 space-y-6">
              {activeItem ? (
                <>
                  {/* Customer Card */}
                  <ConsultationCustomerCard
                    item={activeItem}
                    onAccept={handleAcceptCustomer}
                    onNoShow={handleNoShow}
                    onComplete={handleComplete}
                    onStartTranslation={() => setShowTranslation(true)}
                    isInService={activeItem.status === 'IN_SERVICE'}
                  />

                  {/* Session Notes */}
                  {activeItem.status === 'IN_SERVICE' && (
                    <Card className="animate-fade-in">
                      <CardHeader
                        title="Session Notes"
                        subtitle="Document key points from the consultation"
                        action={
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<FileText className="w-4 h-4" />}
                          >
                            View History
                          </Button>
                        }
                      />
                      <CardBody>
                        <Textarea
                          placeholder="Enter consultation notes..."
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          rows={4}
                        />
                        <div className="mt-4 flex items-center justify-between text-caption text-brand-fog">
                          <span>
                            {translations.length} translations in session
                          </span>
                          <span>
                            Auto-saved
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Language Selection */}
                  <Card className="animate-fade-in">
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm text-brand-fog">Customer language</p>
                        <p className="text-body-lg font-medium text-white">
                          {SUPPORTED_LANGUAGES[selectedLanguage]?.name || 'English'}
                        </p>
                      </div>
                      <CompactLanguageSelector
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                      />
                    </CardBody>
                  </Card>
                </>
              ) : (
                <NoConsultationCard onCallNext={handleCallNext} queueCount={waitingItems.length} />
              )}
            </div>

            {/* Queue Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Consultation Queue"
                  subtitle={`${waitingItems.length} customers waiting`}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCallNext}
                      disabled={waitingItems.length === 0 || !!activeItem}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                  }
                />
                <CardBody className="p-0">
                  {isLoading ? (
                    <div className="p-6 text-center text-brand-fog">Loading...</div>
                  ) : waitingItems.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-success-400/20 mx-auto mb-3 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-success-400" />
                      </div>
                      <p className="text-body-sm text-brand-fog">No customers waiting</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-harbor/30">
                      {waitingItems.map((item, index) => (
                        <ConsultorQueueItem
                          key={item.id}
                          item={item}
                          position={index + 1}
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Today's Summary */}
              <Card>
                <CardHeader
                  title="Today's Summary"
                  subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                />
                <CardBody>
                  <div className="space-y-3">
                    <SummaryItem label="Consultations Completed" value="8" />
                    <SummaryItem label="Avg. Session Duration" value="24 min" />
                    <SummaryItem label="Languages Served" value="4" />
                    <SummaryItem label="Customer Satisfaction" value="4.8/5" />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
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
// CONSULTATION CUSTOMER CARD
// =============================================================================

interface ConsultationCustomerCardProps {
  item: QueueItemWithSession;
  onAccept: () => void;
  onNoShow: () => void;
  onComplete: () => void;
  onStartTranslation: () => void;
  isInService: boolean;
}

function ConsultationCustomerCard({
  item,
  onAccept,
  onNoShow,
  onComplete,
  onStartTranslation,
  isInService,
}: ConsultationCustomerCardProps): React.ReactElement {
  const language = SUPPORTED_LANGUAGES[item.session.preferredLanguage as LanguageCode];

  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardBody>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                initials={getInitials(item.session.customerName)}
                size="xl"
              />
              <span 
                className="absolute -bottom-1 -right-1 text-2xl"
                title={language?.name}
              >
                {language?.flag}
              </span>
            </div>
            <div>
              <h2 className="text-h2 font-semibold text-white">
                {item.session.customerName || 'Guest Customer'}
              </h2>
              <p className="text-body text-brand-fog mt-1">
                {language?.name} speaker • {item.session.serviceType?.replace('_', ' ')}
              </p>
              {item.session.emotionState && (
                <Badge 
                  variant={item.session.emotionState === 'CALM' ? 'success' : 'warning'}
                  className="mt-2"
                >
                  {item.session.emotionState}
                </Badge>
              )}
            </div>
          </div>

          <Badge variant={isInService ? 'info' : 'warning'} size="lg">
            {isInService ? 'In Consultation' : 'Called'}
          </Badge>
        </div>

        {/* Timeline info */}
        <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-brand-steel-blue/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-fog" />
            <span className="text-body-sm text-brand-fog">
              Waiting since {formatRelativeTime(item.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-fog" />
            <span className="text-body-sm text-brand-fog">
              Est. {item.estimatedWaitMinutes} min service
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isInService ? (
            <>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                leftIcon={<MessageSquare className="w-5 h-5" />}
                onClick={onStartTranslation}
              >
                Open Translation
              </Button>
              <Button
                variant="success"
                size="lg"
                className="flex-1"
                leftIcon={<CheckCircle className="w-5 h-5" />}
                onClick={onComplete}
              >
                End Consultation
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={onAccept}
              >
                Begin Consultation
              </Button>
              <Button
                variant="danger"
                size="lg"
                leftIcon={<XCircle className="w-5 h-5" />}
                onClick={onNoShow}
              >
                No Show
              </Button>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// =============================================================================
// NO CONSULTATION CARD
// =============================================================================

interface NoConsultationCardProps {
  onCallNext: () => void;
  queueCount: number;
}

function NoConsultationCard({ onCallNext, queueCount }: NoConsultationCardProps): React.ReactElement {
  return (
    <Card className="h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-brand-steel-blue/30 mx-auto mb-4 flex items-center justify-center">
          <User className="w-12 h-12 text-brand-fog" />
        </div>
        <h2 className="text-h2 font-semibold text-white mb-2">
          Ready for Consultations
        </h2>
        <p className="text-body text-brand-fog mb-6 max-w-sm">
          {queueCount > 0
            ? `${queueCount} customer${queueCount > 1 ? 's' : ''} waiting for consultation services`
            : 'No customers currently waiting for consultations'}
        </p>
        <Button
          size="lg"
          onClick={onCallNext}
          disabled={queueCount === 0}
          leftIcon={<Bell className="w-5 h-5" />}
        >
          Call Next Customer
        </Button>
      </div>
    </Card>
  );
}

// =============================================================================
// CONSULTOR QUEUE ITEM
// =============================================================================

interface ConsultorQueueItemProps {
  item: QueueItemWithSession;
  position: number;
}

function ConsultorQueueItem({ item, position }: ConsultorQueueItemProps): React.ReactElement {
  const language = SUPPORTED_LANGUAGES[item.session.preferredLanguage as LanguageCode];

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-brand-steel-blue/20 transition-colors">
      <span className="w-6 h-6 rounded-full bg-brand-harbor/30 flex items-center justify-center text-caption text-brand-fog">
        {position}
      </span>
      <Avatar
        initials={getInitials(item.session.customerName)}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-white truncate">
          {item.session.customerName || 'Guest'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm">{language?.flag}</span>
          <span className="text-caption text-brand-fog truncate">
            {item.session.serviceType?.replace('_', ' ')}
          </span>
        </div>
      </div>
      <Badge variant={item.priority === 'URGENT' ? 'danger' : 'default'} size="sm">
        {item.priority}
      </Badge>
    </div>
  );
}

// =============================================================================
// SUMMARY ITEM
// =============================================================================

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({ label, value }: SummaryItemProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-brand-fog">{label}</span>
      <span className="text-body font-medium text-white">{value}</span>
    </div>
  );
}

export default ConsultorDashboard;
