import { useState, useEffect, useCallback } from 'react';
import { Bell, ChevronRight, User, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { formatRelativeTime, getInitials } from '../lib/utils';
import { Header, Button, Card, CardHeader, CardBody, Badge, Avatar } from '../components/ui';
import { TranslationPanel, CompactLanguageSelector } from '../components/translation';
import { useSessionStore } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { SUPPORTED_LANGUAGES, QueueStatus, type QueueItemWithSession, type LanguageCode } from '../types';

// =============================================================================
// TELLER DASHBOARD
// =============================================================================

export function TellerDashboard(): React.ReactElement {
  const { user } = useAuthStore();
  const { currentSession, loadSession, clearSession, selectedLanguage, setSelectedLanguage } = useSessionStore();
  
  const [queueItems, setQueueItems] = useState<QueueItemWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeItem, setActiveItem] = useState<QueueItemWithSession | null>(null);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const items = await api.getQueue('TELLER');
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
      const item = await api.callNextInQueue('TELLER');
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

  // Accept customer (move to IN_SERVICE)
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

  // Complete transaction
  const handleComplete = useCallback(async () => {
    if (!activeItem) return;
    
    try {
      await api.updateQueueItem(activeItem.id, { status: QueueStatus.COMPLETED });
      setActiveItem(null);
      setShowTranslation(false);
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

  // Set active item from queue state
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
        title="Teller Station"
        subtitle={`Station ${user?.id?.slice(-2) || '01'}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={activeItem ? 'success' : 'default'}>
              {activeItem ? 'Customer Present' : 'Available'}
            </Badge>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Service Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Customer Card */}
              {activeItem ? (
                <CurrentCustomerCard
                  item={activeItem}
                  onAccept={handleAcceptCustomer}
                  onNoShow={handleNoShow}
                  onComplete={handleComplete}
                  onStartTranslation={() => setShowTranslation(true)}
                  isInService={activeItem.status === 'IN_SERVICE'}
                />
              ) : (
                <NoCustomerCard onCallNext={handleCallNext} queueCount={waitingItems.length} />
              )}

              {/* Language Quick Select */}
              {activeItem && (
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
              )}
            </div>

            {/* Queue Sidebar */}
            <Card>
              <CardHeader
                title="Teller Queue"
                subtitle={`${waitingItems.length} customers waiting`}
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCallNext}
                    disabled={waitingItems.length === 0 || !!activeItem}
                  >
                    <Bell className="w-4 h-4" />
                    Call Next
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
                    <p className="text-body-sm text-brand-fog">Queue is empty</p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-harbor/30">
                    {waitingItems.map((item, index) => (
                      <QueueListItem
                        key={item.id}
                        item={item}
                        position={index + 1}
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
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
// CURRENT CUSTOMER CARD
// =============================================================================

interface CurrentCustomerCardProps {
  item: QueueItemWithSession;
  onAccept: () => void;
  onNoShow: () => void;
  onComplete: () => void;
  onStartTranslation: () => void;
  isInService: boolean;
}

function CurrentCustomerCard({
  item,
  onAccept,
  onNoShow,
  onComplete,
  onStartTranslation,
  isInService,
}: CurrentCustomerCardProps): React.ReactElement {
  const language = SUPPORTED_LANGUAGES[item.session.preferredLanguage as LanguageCode];

  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardBody>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              initials={getInitials(item.session.customerName)}
              size="lg"
            />
            <div>
              <h2 className="text-h2 font-semibold text-white">
                {item.session.customerName || 'Guest Customer'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="text-xl"
                  title={language?.name}
                >
                  {language?.flag || '🌐'}
                </span>
                <span className="text-body-sm text-brand-fog">
                  {language?.name || 'Unknown'} speaker
                </span>
              </div>
            </div>
          </div>

          <Badge
            variant={isInService ? 'success' : 'warning'}
          >
            {isInService ? 'In Service' : 'Called'}
          </Badge>
        </div>

        {/* Service details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-brand-steel-blue/30">
            <p className="text-caption text-brand-fog">Service Type</p>
            <p className="text-body font-medium text-white mt-1">
              {item.session.serviceType?.replace('_', ' ') || 'General'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-brand-steel-blue/30">
            <p className="text-caption text-brand-fog">Priority</p>
            <p className="text-body font-medium text-white mt-1">
              {item.priority}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-brand-steel-blue/30">
            <p className="text-caption text-brand-fog">Wait Time</p>
            <p className="text-body font-medium text-white mt-1">
              {formatRelativeTime(item.createdAt)}
            </p>
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
                Complete
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
                Accept Customer
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
// NO CUSTOMER CARD
// =============================================================================

interface NoCustomerCardProps {
  onCallNext: () => void;
  queueCount: number;
}

function NoCustomerCard({ onCallNext, queueCount }: NoCustomerCardProps): React.ReactElement {
  return (
    <Card className="h-[300px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-brand-steel-blue/30 mx-auto mb-4 flex items-center justify-center">
          <User className="w-10 h-10 text-brand-fog" />
        </div>
        <h2 className="text-h2 font-semibold text-white mb-2">
          Ready to Serve
        </h2>
        <p className="text-body text-brand-fog mb-6">
          {queueCount > 0
            ? `${queueCount} customer${queueCount > 1 ? 's' : ''} waiting in queue`
            : 'No customers waiting'}
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
// QUEUE LIST ITEM
// =============================================================================

interface QueueListItemProps {
  item: QueueItemWithSession;
  position: number;
}

function QueueListItem({ item, position }: QueueListItemProps): React.ReactElement {
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
          <span className="text-caption text-brand-fog">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-brand-harbor" />
    </div>
  );
}

export default TellerDashboard;
