# AI_INTEGRATION.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: AI model integration, fine-tuning, and management procedures  
**Last Updated**: August 24, 2025  
**Phase**: MVP Development  

## Overview

This document details the integration of Google Cloud Translation, OpenAI Whisper, and Hume AI services for cPort's specialized banking translation needs. Includes fine-tuning strategies for Maine's immigrant communities and banking terminology.

---

## **GOOGLE CLOUD TRANSLATION SETUP**

### **Project Configuration**

#### **Google Cloud Console Setup**
```yaml
Required Steps:
1. Create new Google Cloud Project: "cport-translation-prod"
2. Enable APIs:
   - Cloud Translation API
   - AutoML Translation API  
   - Cloud Storage API (for training data)
3. Set up billing account with spending limits
4. Create service account with minimal permissions
```

#### **Service Account Permissions**
```yaml
Required Roles:
  - Cloud Translation API User
  - AutoML Editor (for model training)
  - Storage Object Admin (for training data upload)
  - Service Account Token Creator (for API access)

Security Best Practices:
  - Separate service accounts for dev/staging/production
  - Rotate service account keys quarterly
  - Enable audit logging for all translation requests
```

#### **API Quotas and Limits**
```yaml
Default Quotas:
  - Translation requests: 1,000 per minute
  - AutoML training: 50 operations per day
  - Custom model hosting: 20 models maximum

cPort Usage Estimates:
  - Peak usage: 100 requests per minute
  - Daily requests: 5,000-8,000 translations
  - Custom models needed: 5 (one per target language)
```

### **Base Translation Integration**

#### **Translation Service Class (server/src/services/TranslationService.ts)**
```typescript
import { TranslationServiceClient } from '@google-cloud/translate';

export class CPortTranslationService {
  private translateClient: TranslationServiceClient;
  private readonly PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
  
  // Custom model configurations for cPort
  private readonly CUSTOM_MODELS = {
    'pt': `projects/${this.PROJECT_ID}/locations/us-central1/models/cport-portuguese-banking`,
    'fr': `projects/${this.PROJECT_ID}/locations/us-central1/models/cport-french-banking`,
    'so': `projects/${this.PROJECT_ID}/locations/us-central1/models/cport-somali-banking`,
    'ar': `projects/${this.PROJECT_ID}/locations/us-central1/models/cport-arabic-banking`,
    'es': `projects/${this.PROJECT_ID}/locations/us-central1/models/cport-spanish-banking`
  };

  constructor() {
    this.translateClient = new TranslationServiceClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: this.PROJECT_ID
    });
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    context?: string
  ): Promise<TranslationResult> {
    try {
      // Use custom model if available and appropriate context
      if (this.CUSTOM_MODELS[targetLanguage] && this.isBankingContext(context)) {
        return await this.translateWithCustomModel(text, targetLanguage, context);
      }
      
      // Fallback to base Google Translate
      return await this.translateWithBaseModel(text, targetLanguage);
    } catch (error) {
      // Always fallback to base model if custom model fails
      console.warn(`Custom model failed for ${targetLanguage}, falling back to base model`);
      return await this.translateWithBaseModel(text, targetLanguage);
    }
  }

  private isBankingContext(context?: string): boolean {
    const bankingContexts = ['banking', 'loans', 'accounts', 'transactions', 'financial'];
    return context ? bankingContexts.includes(context.toLowerCase()) : false;
  }
}
```

---

## **CUSTOM MODEL FINE-TUNING STRATEGY**

### **Training Data Collection**

#### **Data Sources for cPort Banking Terminology**
```yaml
Primary Sources:
  - cPort loan agreements and disclosures (500+ documents)
  - Member handbook and product descriptions (200+ pages)  
  - Regulatory forms and compliance documents (100+ forms)
  - Marketing materials and website content (300+ pages)
  - NCUA and Maine banking regulation translations

Community Sources:
  - Greater Portland Immigrant Welcome Center glossaries
  - Maine Immigrants' Rights Coalition validated translations
  - Community leader feedback on financial concepts
  - Cultural context for banking relationships
```

#### **Training Data Format**
```csv
English,Portuguese,French,Somali,Arabic,Spanish,Context,Priority
"share draft account","conta de rascunho compartilhado","compte de traite partagée","akoonka qorshaha la wadaago","حساب الكتابة المشتركة","cuenta de giro compartido","banking","high"
"share certificate","certificado de participação","certificat de participation","shahaadada qaybinta","شهادة المشاركة","certificado de participación","banking","high"
"member dividend","dividendo do membro","dividende du membre","qayb-qaybinta xubinta","أرباح العضو","dividendo del miembro","banking","high"
"overdraft protection","proteção contra descoberto","protection contre découvert","ilaalinta kharashka","حماية السحب على المكشوف","protección contra sobregiro","banking","high"
"annual percentage rate","taxa percentual anual","taux de pourcentage annuel","qiimaha boqolkiiba sanadka","معدل الفائدة السنوي","tasa de porcentaje anual","loans","critical"
```

### **Model Training Process**

#### **Phase 1: Data Preparation (Month 1)**
```yaml
Week 1-2: Document Collection
  - Extract text from cPort documents
  - Clean and normalize text data
  - Remove PII and sensitive information
  - Create baseline English terminology list

Week 3-4: Community Translation
  - Partner with local immigrant organizations
  - Native speaker validation sessions
  - Cultural appropriateness review
  - Create validated translation pairs
```

#### **Phase 2: Model Training (Month 2)**
```yaml
AutoML Training Configuration:
  - Dataset size: 6,000+ sentence pairs per language
  - Training time: 2-4 hours per language model
  - Validation split: 80% training, 20% validation
  - Performance target: >90% BLEU score for banking terms

Training Order Priority:
  1. Portuguese (largest immigrant population)
  2. French (second largest population)  
  3. Somali (high banking service usage)
  4. Arabic (multiple dialects, complex)
  5. Spanish (general support)
```

#### **Phase 3: Model Validation (Month 3)**
```yaml
Validation Process:
  - Automated accuracy testing against validation set
  - Community partner human evaluation
  - A/B testing against base Google Translate
  - Staff feedback during training sessions

Validation Criteria:
  - Banking terminology accuracy: >95%
  - Cultural appropriateness: Community approval
  - Service context relevance: Staff validation
  - Error handling: Graceful fallback testing
```

### **AutoML Training Commands**

#### **Dataset Upload Script**
```bash
#!/bin/bash
# Upload training data to Google Cloud Storage

BUCKET_NAME="cport-translation-training-data"
PROJECT_ID="cport-translation-prod"

# Create bucket if it doesn't exist
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME

# Upload training datasets
gsutil cp data/portuguese-banking-terms.csv gs://$BUCKET_NAME/
gsutil cp data/french-banking-terms.csv gs://$BUCKET_NAME/
gsutil cp data/somali-banking-terms.csv gs://$BUCKET_NAME/
gsutil cp data/arabic-banking-terms.csv gs://$BUCKET_NAME/
gsutil cp data/spanish-banking-terms.csv gs://$BUCKET_NAME/

echo "Training data uploaded successfully"
```

#### **Model Training Configuration**
```yaml
AutoML Training Parameters:
  - Model type: Translation
  - Source language: English (en)
  - Target languages: [pt, fr, so, ar, es]
  - Training budget: 2 node hours per model
  - Optimization objective: Minimize BLEU loss
  - Validation method: Automatic split
```

---

## **AUDIO PROCESSING INTEGRATION**

### **OpenAI Whisper Integration**

#### **Whisper Service Configuration**
```typescript
import OpenAI from 'openai';

export class AudioTranscriptionService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async transcribeAudio(audioBlob: Buffer, language?: string): Promise<TranscriptionResult> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioBlob,
        model: "whisper-1",
        language: language, // Optional: 'pt', 'fr', 'so', 'ar', 'es'
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
      });

      return {
        text: transcription.text,
        confidence: this.calculateConfidence(transcription),
        language: transcription.language,
        duration: transcription.duration
      };
    } catch (error) {
      // Fallback to Web Speech API
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  private calculateConfidence(transcription: any): number {
    // Calculate average confidence from word-level timestamps
    if (!transcription.words) return 0.8; // Default confidence
    
    const avgConfidence = transcription.words.reduce(
      (acc: number, word: any) => acc + (word.confidence || 0.8), 0
    ) / transcription.words.length;
    
    return Math.round(avgConfidence * 100) / 100;
  }
}
```

#### **Audio Processing Workflow**
```yaml
Audio Input Flow:
  1. Capture audio via MediaRecorder API (browser)
  2. Send audio blob to backend via WebSocket
  3. Process with Whisper API (preferred) or Web Speech API (fallback)
  4. Return transcription with confidence score
  5. Send transcribed text to translation service
  6. Display both transcription and translation to staff

Quality Thresholds:
  - High confidence: >90% - Display with green indicator
  - Medium confidence: 70-90% - Display with yellow indicator  
  - Low confidence: <70% - Display with red indicator, suggest retry
```

---

## **HUME AI EMOTION DETECTION**

### **Emotion Detection Integration**

#### **Hume AI Service Configuration**
```typescript
export class EmotionDetectionService {
  private readonly HUME_API_URL = 'https://api.hume.ai/v0/batch/jobs';
  private readonly API_KEY = process.env.HUME_API_KEY;

  async analyzeCustomerEmotion(audioBlob: Buffer): Promise<EmotionAnalysis> {
    try {
      const response = await fetch(this.HUME_API_URL, {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          models: {
            prosody: {}
          },
          transcription: {
            language: null // Auto-detect
          }
        })
      });

      const analysis = await response.json();
      return this.processEmotionResults(analysis);
    } catch (error) {
      // Emotion detection is optional - continue without it
      console.warn('Emotion detection unavailable:', error.message);
      return { status: 'unavailable' };
    }
  }

  private processEmotionResults(analysis: any): EmotionAnalysis {
    const emotions = analysis.results?.[0]?.predictions?.[0]?.emotions || [];
    
    // Focus on customer service relevant emotions
    const relevantEmotions = {
      frustration: this.findEmotionScore(emotions, 'Frustration'),
      confusion: this.findEmotionScore(emotions, 'Confusion'),
      anxiety: this.findEmotionScore(emotions, 'Anxiety'),
      satisfaction: this.findEmotionScore(emotions, 'Satisfaction'),
      urgency: this.calculateUrgency(emotions)
    };

    return {
      status: 'analyzed',
      emotions: relevantEmotions,
      recommendation: this.getServiceRecommendation(relevantEmotions)
    };
  }

  private getServiceRecommendation(emotions: any): ServiceRecommendation {
    if (emotions.frustration > 0.7 || emotions.anxiety > 0.8) {
      return {
        level: 'escalate',
        message: 'Customer may need additional assistance or manager support'
      };
    } else if (emotions.confusion > 0.6) {
      return {
        level: 'clarify',
        message: 'Customer may need simpler explanations or visual aids'
      };
    }
    
    return {
      level: 'normal',
      message: 'Customer appears comfortable with current service level'
    };
  }
}
```

---

## **MODEL PERFORMANCE MONITORING**

### **Translation Quality Metrics**

#### **Accuracy Tracking System**
```typescript
export class TranslationMetricsService {
  async recordTranslation(translation: TranslationRecord): Promise<void> {
    await this.database.translationLog.create({
      data: {
        sessionId: translation.sessionId,
        originalText: translation.originalText,
        translatedText: translation.translatedText,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        modelUsed: translation.modelUsed, // 'custom' or 'base'
        confidence: translation.confidence,
        context: translation.context,
        timestamp: new Date()
      }
    });
  }

  async generateAccuracyReport(timeframe: string): Promise<AccuracyReport> {
    const translations = await this.getTranslationsForTimeframe(timeframe);
    
    return {
      totalTranslations: translations.length,
      averageConfidence: this.calculateAverageConfidence(translations),
      customModelUsage: this.calculateCustomModelUsage(translations),
      languageBreakdown: this.getLanguageBreakdown(translations),
      contextBreakdown: this.getContextBreakdown(translations),
      staffFeedbackScore: await this.getStaffFeedbackScore(timeframe)
    };
  }
}
```

#### **Community Validation Integration**
```yaml
Validation Process:
  - Weekly review sessions with community partners
  - Native speaker evaluation of banking term translations
  - Cultural appropriateness scoring (1-5 scale)
  - Feedback integration into model retraining pipeline

Validation Metrics:
  - Translation accuracy: Native speaker agreement >90%
  - Cultural sensitivity: Community leader approval >95%  
  - Banking context: cPort staff validation >95%
  - Customer satisfaction: Post-service survey >4.0/5.0
```

### **Model Retraining Pipeline**

#### **Automated Retraining Triggers**
```yaml
Retraining Conditions:
  - Accuracy drops below 85% for any language
  - >100 staff corrections collected for specific terms
  - Community feedback indicates cultural issues
  - New banking products/regulations require terminology updates

Retraining Process:
  1. Collect feedback and corrections from production usage
  2. Validate new terminology with community partners
  3. Update training datasets with new examples
  4. Retrain models using AutoML with updated data
  5. A/B test new models against current models
  6. Deploy improved models if performance gains confirmed
```

#### **Cost Optimization**
```yaml
Cost Management Strategies:
  - Cache frequently translated phrases to reduce API calls
  - Use confidence thresholds to decide between custom/base models
  - Batch similar translations when possible
  - Monitor usage patterns to optimize model hosting costs

Monthly Cost Targets:
  - Translation API calls: $200-400/month
  - Custom model hosting: $225/month (5 models × $45)
  - Model retraining: $150/month (2 hours × $76)
  - Total AI services: $575-775/month
```

---

## **ERROR HANDLING AND FALLBACKS**

### **Service Degradation Strategy**

#### **Fallback Hierarchy**
```yaml
Translation Service Fallbacks:
  1. Custom cPort model (preferred)
  2. Base Google Cloud Translation
  3. Cached previous translations
  4. Manual staff translation (emergency)

Audio Processing Fallbacks:
  1. OpenAI Whisper API (preferred)
  2. Web Speech API (browser native)
  3. Manual text input by staff

Emotion Detection Fallbacks:
  1. Hume AI analysis (preferred)
  2. Staff observation and manual flagging
  3. Simple keyword detection for urgency
```

#### **Error Recovery Procedures**
```typescript
export class ServiceResilienceManager {
  async handleTranslationFailure(
    originalText: string, 
    targetLanguage: string,
    failedService: string
  ): Promise<TranslationResult> {
    
    // Log failure for monitoring
    await this.logServiceFailure(failedService, originalText);
    
    // Attempt fallback services in order
    const fallbackServices = this.getFallbackServices(failedService);
    
    for (const service of fallbackServices) {
      try {
        const result = await service.translate(originalText, targetLanguage);
        result.source = 'fallback';
        result.reliability = 'degraded';
        return result;
      } catch (fallbackError) {
        continue; // Try next fallback
      }
    }
    
    // Final fallback: return original text with error indication
    return {
      translatedText: originalText,
      confidence: 0,
      source: 'failed',
      reliability: 'failed',
      error: 'All translation services unavailable'
    };
  }
}
```

---

## **IMPLEMENTATION TIMELINE**

### **AI Integration Development Schedule**

#### **Month 1: Foundation Setup**
```yaml
Week 1:
  - Google Cloud project setup and API enablement
  - Service account creation and permissions
  - Basic translation API integration
  - Development environment testing

Week 2:
  - Data collection from cPort documents
  - Initial terminology extraction
  - Community partner outreach
  - Training data format standardization

Week 3:
  - OpenAI Whisper API integration
  - Audio processing workflow development
  - Basic error handling implementation
  - Performance testing setup

Week 4:
  - Hume AI integration (optional)
  - Service monitoring dashboard
  - Cost tracking implementation
  - Month 1 milestone review
```

#### **Month 2: Model Training**
```yaml
Week 1:
  - Portuguese model training and validation
  - Community feedback integration
  - Model deployment testing
  - Performance benchmarking

Week 2:
  - French model training and validation
  - A/B testing framework setup
  - Translation caching implementation
  - Error recovery testing

Week 3:
  - Somali model training and validation
  - Staff training interface development
  - Feedback collection system
  - Integration testing

Week 4:
  - Arabic and Spanish model training
  - Production deployment preparation
  - Documentation completion
  - Month 2 milestone review
```