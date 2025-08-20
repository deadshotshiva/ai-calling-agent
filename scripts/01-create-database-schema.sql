-- AI Calling Agent SaaS Platform Database Schema
-- This script creates all necessary tables for the platform

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'agent', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone numbers purchased through VAPI
CREATE TABLE IF NOT EXISTS purchased_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    vapi_phone_number_id VARCHAR(255) UNIQUE NOT NULL,
    country_code VARCHAR(5) NOT NULL DEFAULT 'US',
    is_active BOOLEAN DEFAULT true,
    monthly_cost DECIMAL(10,2),
    purchased_by UUID REFERENCES users(id),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice configurations for AI agents
CREATE TABLE IF NOT EXISTS voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'elevenlabs' CHECK (provider IN ('elevenlabs', 'openai')),
    voice_id VARCHAR(255) NOT NULL, -- Provider-specific voice ID
    settings JSONB DEFAULT '{}', -- Voice-specific settings (speed, pitch, etc.)
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI agent configurations
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    voice_id UUID REFERENCES voices(id),
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call campaigns for outbound calling
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    ai_agent_id UUID REFERENCES ai_agents(id),
    phone_number_id UUID REFERENCES purchased_numbers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    target_contacts JSONB DEFAULT '[]', -- Array of contact objects
    call_schedule JSONB DEFAULT '{}', -- Schedule configuration
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual calls (both inbound and outbound)
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vapi_call_id VARCHAR(255) UNIQUE,
    campaign_id UUID REFERENCES campaigns(id), -- NULL for inbound calls
    phone_number_id UUID REFERENCES purchased_numbers(id),
    ai_agent_id UUID REFERENCES ai_agents(id),
    caller_number VARCHAR(20) NOT NULL,
    recipient_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'transferred')),
    duration_seconds INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call transcripts with real-time updates
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL, -- Milliseconds from call start
    confidence DECIMAL(4,3), -- STT confidence score
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call transfers to human agents
CREATE TABLE IF NOT EXISTS call_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    transferred_to_user_id UUID REFERENCES users(id),
    transfer_reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_call_id ON transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON transcripts(call_id, timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Insert default voice configurations
INSERT INTO voices (name, provider, voice_id, settings) VALUES
('Rachel (Professional)', 'elevenlabs', '21m00Tcm4TlvDq8ikWAM', '{"stability": 0.5, "similarity_boost": 0.8}'),
('Josh (Friendly)', 'elevenlabs', '29vD33N1CtxCmqQRPOHJ', '{"stability": 0.6, "similarity_boost": 0.7}'),
('Bella (Warm)', 'elevenlabs', 'EXAVITQu4vr4xnSDxMaL', '{"stability": 0.7, "similarity_boost": 0.8}'),
('OpenAI Alloy', 'openai', 'alloy', '{"speed": 1.0}'),
('OpenAI Echo', 'openai', 'echo', '{"speed": 1.0}')
ON CONFLICT DO NOTHING;

-- Insert default AI agent
INSERT INTO ai_agents (name, system_prompt, voice_id, created_by) 
SELECT 
    'Default Customer Service Agent',
    'You are a helpful customer service representative. Be polite, professional, and concise. If you cannot help with a request, offer to transfer the call to a human agent.',
    v.id,
    NULL
FROM voices v 
WHERE v.name = 'Rachel (Professional)'
LIMIT 1
ON CONFLICT DO NOTHING;
