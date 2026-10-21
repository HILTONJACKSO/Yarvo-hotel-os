'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Globe, Save, RotateCcw, ExternalLink, Upload, Image as ImageIcon, 
  Trash2, Plus, Sparkles, Check, AlertCircle, Eye, ArrowUpRight,
  Layers, MessageSquare, Camera, Compass, PhoneCall, ChevronDown, ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { WebsiteContent } from '@/types/cms';
import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';

// ==========================================
// 1. REUSABLE IMAGE PICKER & UPLOADER
// ==========================================
interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  recommendedSize?: string;
}

function ImagePicker({ label, value, onChange, description, recommendedSize }: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size must be less than 10MB', 'error', 'File Too Large');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        onChange(data.url);
        showToast('Image uploaded successfully', 'success', 'Uploaded');
      } else {
        showToast(data.error || 'Failed to upload image', 'error', 'Upload Error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('A network error occurred while uploading', 'error', 'Upload Error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">{label}</label>
        {recommendedSize && (
          <span className="text-[11px] text-gray-400 font-mono">Rec: {recommendedSize}</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Thumbnail Preview */}
        <div className="relative w-24 h-20 sm:w-28 sm:h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 group">
          {value ? (
            <>
              <img src={value} alt={label} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                title="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <ImageIcon size={20} />
              <span className="text-[9px] mt-1 uppercase tracking-wider text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Input & Action */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste image URL (https://...) or upload below"
              className="flex-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
          {description && <p className="text-[11px] text-gray-500">{description}</p>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. MAIN CMS PAGE
// ==========================================
export default function CmsDashboardPage() {
  const { showToast } = useToast();
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CMS_CONTENT);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'slides' | 'events_gallery' | 'subpages' | 'general'>('hero');

  // Load published CMS content
  useEffect(() => {
    async function loadCmsData() {
      try {
        const res = await fetch('/api/cms', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          setContent(mergeWithDefaultContent(json.data));
          if (json.propertyId) setPropertyId(json.propertyId);
        }
      } catch (err) {
        console.error('Failed to load CMS content:', err);
        showToast('Using local defaults. Could not reach server.', 'info', 'CMS Notice');
      } finally {
        setIsLoading(false);
      }
    }
    loadCmsData();
  }, [showToast]);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          propertyId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setContent(mergeWithDefaultContent(data.data));
        showToast('Website content published and saved live!', 'success', 'Changes Saved');
      } else {
        showToast(data.error || 'Failed to save CMS changes', 'error', 'Save Failed');
      }
    } catch (err: any) {
      console.error('Error saving CMS:', err);
      showToast(err.message || 'Network error occurred while saving', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to authentic Kwalee defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to restore default Kwalee Beach Resort content? Unsaved changes will be replaced.')) {
      setContent(DEFAULT_CMS_CONTENT);
      showToast('Restored default website content. Click "Save Changes" to publish.', 'info', 'Reset to Defaults');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading Website CMS configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Sticky Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-40">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
            <Globe size={16} />
            <span>Kwalee Beach Resort • Live CMS</span>
          </div>
          <h1 className="text-2xl font-serif text-gray-900 mt-1">Website Content Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Edit landing page sections, upload photos, customize links, and manage resort subpages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye size={14} />
            Preview Live Site
            <ArrowUpRight size={13} className="text-gray-400" />
          </Link>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset form to default Kwalee texts and photos"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#1B2418] hover:bg-[#2C3B27] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save size={15} />
                Save & Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200 scrollbar-none">
        {[
          { id: 'hero', label: 'Hero & About', icon: Sparkles },
          { id: 'features', label: 'Beach, Pool, Bar, Dining', icon: Layers },
          { id: 'slides', label: 'Carousel & Reviews', icon: MessageSquare },
          { id: 'events_gallery', label: 'Events, Form & Gallery', icon: Camera },
          { id: 'subpages', label: 'Subpages (Stay, Dining, etc.)', icon: Compass },
          { id: 'general', label: 'Header, Footer & Contact', icon: PhoneCall },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1B2418] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HERO & ABOUT                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Top of Homepage</span>
              <h2 className="text-lg font-serif text-gray-900">Hero Header & Background</h2>
              <p className="text-xs text-gray-500">The main banner visitors see immediately when opening kwaleebeachresort.com.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Subtitle / Location Tag</label>
                  <input
                    type="text"
                    value={content.hero.subtitle}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#F5A623]"
                    placeholder="e.g. Liberia • West African Coast"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Main Headline</label>
                  <textarea
                    rows={2}
                    value={content.hero.title}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#F5A623] resize-none"
                    placeholder="WHERE THE OCEAN MEETS YOUR ESCAPE."
                  />
                  <span className="text-[10px] text-gray-400">Use Enter for line breaks.</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Intro Description</label>
                  <textarea
                    rows={3}
                    value={content.hero.description}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#F5A623] resize-none"
                    placeholder="Discover the beauty of Kwalee Beach Resort..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImagePicker
                  label="Hero Background Image"
                  value={content.hero.bgImage}
                  onChange={(url) => setContent({ ...content, hero: { ...content.hero, bgImage: url } })}
                  description="High-resolution coastal or resort view. Upload PNG, JPG, or WEBP."
                  recommendedSize="1920x1080px"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Primary Button Label</label>
                    <input
                      type="text"
                      value={content.hero.bookButtonText}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, bookButtonText: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Primary Button Link</label>
                    <input
                      type="text"
                      value={content.hero.bookButtonLink}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, bookButtonLink: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Secondary Button Label</label>
                    <input
                      type="text"
                      value={content.hero.exploreButtonText}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, exploreButtonText: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Secondary Button Link</label>
                    <input
                      type="text"
                      value={content.hero.exploreButtonLink}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, exploreButtonLink: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Welcome Section</span>
              <h2 className="text-lg font-serif text-gray-900">About Kwalee Beach Resort</h2>
              <p className="text-xs text-gray-500">The introductory story with overlapping photo collage below the hero.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Section Badge</label>
                  <input
                    type="text"
                    value={content.about.badge}
                    onChange={(e) => setContent({ ...content, about: { ...content.about, badge: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    placeholder="About Us"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">About Heading</label>
                  <textarea
                    rows={2}
                    value={content.about.title}
                    onChange={(e) => setContent({ ...content, about: { ...content.about, title: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                    placeholder="A Place to Slow Down. Stay Better, Travel Happier."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">About Story Description</label>
                  <textarea
                    rows={4}
                    value={content.about.description}
                    onChange={(e) => setContent({ ...content, about: { ...content.about, description: e.target.value } })}
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Button Text</label>
                    <input
                      type="text"
                      value={content.about.buttonText}
                      onChange={(e) => setContent({ ...content, about: { ...content.about, buttonText: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Button Link</label>
                    <input
                      type="text"
                      value={content.about.buttonLink}
                      onChange={(e) => setContent({ ...content, about: { ...content.about, buttonLink: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImagePicker
                  label="Primary Room Photo (Large)"
                  value={content.about.mainImage}
                  onChange={(url) => setContent({ ...content, about: { ...content.about, mainImage: url } })}
                  recommendedSize="800x600px"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Card Title</label>
                    <input
                      type="text"
                      value={content.about.mainImageTitle}
                      onChange={(e) => setContent({ ...content, about: { ...content.about, mainImageTitle: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="Ocean Room"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 tracking-wide uppercase">Card Subtitle</label>
                    <input
                      type="text"
                      value={content.about.mainImageSubtitle}
                      onChange={(e) => setContent({ ...content, about: { ...content.about, mainImageSubtitle: e.target.value } })}
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="Wake up to the sound of waves"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <ImagePicker
                    label="Secondary Overlapping Photo (Small)"
                    value={content.about.secondaryImage}
                    onChange={(url) => setContent({ ...content, about: { ...content.about, secondaryImage: url } })}
                    recommendedSize="600x400px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BEACH, POOL, BAR, DINING                                          */}
      {/* ========================================================================= */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { key: 'beach', name: 'The Beach Section', defaultLabel: 'The Beach' },
            { key: 'pool', name: 'The Pool Section', defaultLabel: 'The Pool' },
            { key: 'bar', name: 'The Bar Section', defaultLabel: 'The Bar' },
            { key: 'dining', name: 'Dining Section', defaultLabel: 'Dining' },
          ].map((item) => {
            const feat = content.features[item.key as keyof typeof content.features];
            return (
              <div key={item.key} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h3 className="font-serif text-base text-gray-900 font-semibold">{item.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                    Feature #{item.key}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Label / Tag</label>
                    <input
                      type="text"
                      value={feat.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            [item.key]: { ...feat, label: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Headline</label>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            [item.key]: { ...feat, title: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Description Paragraph</label>
                    <textarea
                      rows={3}
                      value={feat.description}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            [item.key]: { ...feat, description: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                    />
                  </div>

                  <ImagePicker
                    label="Section Feature Photo"
                    value={feat.image}
                    onChange={(url) =>
                      setContent({
                        ...content,
                        features: {
                          ...content.features,
                          [item.key]: { ...feat, image: url },
                        },
                      })
                    }
                    recommendedSize="800x800px"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase">Button Label</label>
                      <input
                        type="text"
                        value={feat.cta}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            features: {
                              ...content.features,
                              [item.key]: { ...feat, cta: e.target.value },
                            },
                          })
                        }
                        className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase">Button Link</label>
                      <input
                        type="text"
                        value={feat.ctaHref}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            features: {
                              ...content.features,
                              [item.key]: { ...feat, ctaHref: e.target.value },
                            },
                          })
                        }
                        className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAROUSEL & TESTIMONIALS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'slides' && (
        <div className="space-y-8">
          {/* Coverflow 3D Carousel Slides */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Interactive Gallery</span>
                <h2 className="text-lg font-serif text-gray-900">3D Coverflow Carousel Slides</h2>
                <p className="text-xs text-gray-500">The rotating animated 3D visual cards on the homepage.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newSlide = {
                    id: `slide-${Date.now()}`,
                    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                    title: 'New Slide Title',
                    subtitle: 'Scenic coastal view',
                  };
                  setContent({ ...content, coverflow: [...content.coverflow, newSlide] });
                }}
                className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <Plus size={14} /> Add Slide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.coverflow.map((slide, idx) => (
                <div key={slide.id || idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600">Slide #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.coverflow.filter((_, i) => i !== idx);
                        setContent({ ...content, coverflow: updated });
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove slide"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <ImagePicker
                    label="Slide Image"
                    value={slide.image}
                    onChange={(url) => {
                      const updated = [...content.coverflow];
                      updated[idx] = { ...updated[idx], image: url };
                      setContent({ ...content, coverflow: updated });
                    }}
                    recommendedSize="600x800px"
                  />

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Slide Title</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => {
                        const updated = [...content.coverflow];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setContent({ ...content, coverflow: updated });
                      }}
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Slide Subtitle</label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => {
                        const updated = [...content.coverflow];
                        updated[idx] = { ...updated[idx], subtitle: e.target.value };
                        setContent({ ...content, coverflow: updated });
                      }}
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Reviews & Testimonials */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Social Proof</span>
                <h2 className="text-lg font-serif text-gray-900">Guest Reviews & Testimonials</h2>
                <p className="text-xs text-gray-500">Manage ratings, quotes, guest names and photos displayed in the review carousel.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newReview = {
                    id: `test-${Date.now()}`,
                    author: 'Guest Name',
                    source: 'Google Reviews',
                    rating: '5.00',
                    text: 'A delightful experience with fantastic staff and peaceful coastal vibes.',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                  };
                  setContent({
                    ...content,
                    testimonials: {
                      ...content.testimonials,
                      items: [...content.testimonials.items, newReview],
                    },
                  });
                }}
                className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <Plus size={14} /> Add Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">Score Display</label>
                <input
                  type="text"
                  value={content.testimonials.ratingScore}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      testimonials: { ...content.testimonials, ratingScore: e.target.value },
                    })
                  }
                  className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                  placeholder="4.8/5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">Review Count Subtitle</label>
                <input
                  type="text"
                  value={content.testimonials.ratingCount}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      testimonials: { ...content.testimonials, ratingCount: e.target.value },
                    })
                  }
                  className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                  placeholder="from 2,800+ reviews"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.testimonials.items.map((rev, idx) => (
                <div key={rev.id || idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Review #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.testimonials.items.filter((_, i) => i !== idx);
                        setContent({
                          ...content,
                          testimonials: { ...content.testimonials, items: updated },
                        });
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 uppercase">Guest Name</label>
                      <input
                        type="text"
                        value={rev.author}
                        onChange={(e) => {
                          const updated = [...content.testimonials.items];
                          updated[idx] = { ...updated[idx], author: e.target.value };
                          setContent({
                            ...content,
                            testimonials: { ...content.testimonials, items: updated },
                          });
                        }}
                        className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 uppercase">Platform/Source</label>
                      <input
                        type="text"
                        value={rev.source}
                        onChange={(e) => {
                          const updated = [...content.testimonials.items];
                          updated[idx] = { ...updated[idx], source: e.target.value };
                          setContent({
                            ...content,
                            testimonials: { ...content.testimonials, items: updated },
                          });
                        }}
                        className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Review Text / Quote</label>
                    <textarea
                      rows={3}
                      value={rev.text}
                      onChange={(e) => {
                        const updated = [...content.testimonials.items];
                        updated[idx] = { ...updated[idx], text: e.target.value };
                        setContent({
                          ...content,
                          testimonials: { ...content.testimonials, items: updated },
                        });
                      }}
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623] resize-none"
                    />
                  </div>

                  <ImagePicker
                    label="Guest Avatar Photo"
                    value={rev.avatar}
                    onChange={(url) => {
                      const updated = [...content.testimonials.items];
                      updated[idx] = { ...updated[idx], avatar: url };
                      setContent({
                        ...content,
                        testimonials: { ...content.testimonials, items: updated },
                      });
                    }}
                    recommendedSize="150x150px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVENTS, FORM & GALLERY                                            */}
      {/* ========================================================================= */}
      {activeTab === 'events_gallery' && (
        <div className="space-y-8">
          {/* Events & Gatherings */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Private Functions</span>
              <h2 className="text-lg font-serif text-gray-900">Events & Celebrations Banner</h2>
              <p className="text-xs text-gray-500">The dark coastal section highlighting weddings, birthdays, and retreats.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Section Headline</label>
                  <textarea
                    rows={2}
                    value={content.events.title}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        events: { ...content.events, title: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={content.events.description}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        events: { ...content.events, description: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Event Bullet Points</label>
                    <button
                      type="button"
                      onClick={() => {
                        setContent({
                          ...content,
                          events: {
                            ...content.events,
                            highlights: [...content.events.highlights, 'New Event Type'],
                          },
                        });
                      }}
                      className="text-[11px] text-[#F5A623] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Add Point
                    </button>
                  </div>
                  <div className="space-y-2">
                    {content.events.highlights.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...content.events.highlights];
                            updated[idx] = e.target.value;
                            setContent({
                              ...content,
                              events: { ...content.events, highlights: updated },
                            });
                          }}
                          className="flex-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#F5A623]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.events.highlights.filter((_, i) => i !== idx);
                            setContent({
                              ...content,
                              events: { ...content.events, highlights: updated },
                            });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImagePicker
                  label="Events Banner Photo"
                  value={content.events.image}
                  onChange={(url) =>
                    setContent({
                      ...content,
                      events: { ...content.events, image: url },
                    })
                  }
                  recommendedSize="900x700px"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">CTA Button Text</label>
                    <input
                      type="text"
                      value={content.events.buttonText}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          events: { ...content.events, buttonText: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">CTA Button Link</label>
                    <input
                      type="text"
                      value={content.events.buttonLink}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          events: { ...content.events, buttonLink: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moments at Kwalee Gallery Grid */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Photo Showcase</span>
                <h2 className="text-lg font-serif text-gray-900">Moments at Kwalee Gallery</h2>
                <p className="text-xs text-gray-500">The masonry photo gallery displayed near the footer of the homepage.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent({
                    ...content,
                    gallery: {
                      ...content.gallery,
                      images: [
                        ...content.gallery.images,
                        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
                      ],
                    },
                  });
                }}
                className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <Plus size={14} /> Add Gallery Image
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {content.gallery.images.map((imgUrl, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-600">Photo #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.gallery.images.filter((_, i) => i !== idx);
                        setContent({
                          ...content,
                          gallery: { ...content.gallery, images: updated },
                        });
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <ImagePicker
                    label={`Image #${idx + 1}`}
                    value={imgUrl}
                    onChange={(url) => {
                      const updated = [...content.gallery.images];
                      updated[idx] = url;
                      setContent({
                        ...content,
                        gallery: { ...content.gallery, images: updated },
                      });
                    }}
                    recommendedSize="800x800px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Final Escape CTA */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Bottom Call-to-Action</span>
              <h2 className="text-lg font-serif text-gray-900">Final Sunset Banner (Your Escape Starts Here)</h2>
              <p className="text-xs text-gray-500">The full-width call to action above the footer.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">CTA Title</label>
                  <textarea
                    rows={2}
                    value={content.finalCta.title}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        finalCta: { ...content.finalCta, title: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Subtitle Tagline</label>
                  <input
                    type="text"
                    value={content.finalCta.subtitle}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        finalCta: { ...content.finalCta, subtitle: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImagePicker
                  label="Sunset Background Photo"
                  value={content.finalCta.bgImage}
                  onChange={(url) =>
                    setContent({
                      ...content,
                      finalCta: { ...content.finalCta, bgImage: url },
                    })
                  }
                  recommendedSize="1920x800px"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Button 1 Label</label>
                    <input
                      type="text"
                      value={content.finalCta.button1Text}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: { ...content.finalCta, button1Text: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Button 1 Link</label>
                    <input
                      type="text"
                      value={content.finalCta.button1Link}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: { ...content.finalCta, button1Link: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SUBPAGES                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'subpages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { key: 'stay', name: 'Stay Page (/stay)', path: '/stay' },
            { key: 'dining', name: 'Dining Page (/dining)', path: '/dining' },
            { key: 'events', name: 'Events Page (/events)', path: '/events' },
            { key: 'tours', name: 'Tours & Activities (/tours)', path: '/tours' },
          ].map((sp) => {
            const pageData = content.subpages[sp.key as keyof typeof content.subpages];
            return (
              <div key={sp.key} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h3 className="font-serif text-base text-gray-900 font-semibold">{sp.name}</h3>
                  <Link
                    href={sp.path}
                    target="_blank"
                    className="text-xs text-[#F5A623] hover:underline flex items-center gap-1"
                  >
                    View Page <ArrowUpRight size={12} />
                  </Link>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Hero Badge</label>
                    <input
                      type="text"
                      value={pageData.badge}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          subpages: {
                            ...content.subpages,
                            [sp.key]: { ...pageData, badge: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Hero Headline</label>
                    <input
                      type="text"
                      value={pageData.title}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          subpages: {
                            ...content.subpages,
                            [sp.key]: { ...pageData, title: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Hero Description</label>
                    <textarea
                      rows={2}
                      value={pageData.description}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          subpages: {
                            ...content.subpages,
                            [sp.key]: { ...pageData, description: e.target.value },
                          },
                        })
                      }
                      className="w-full mt-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                    />
                  </div>

                  <ImagePicker
                    label="Hero Background Photo"
                    value={pageData.bgImage}
                    onChange={(url) =>
                      setContent({
                        ...content,
                        subpages: {
                          ...content.subpages,
                          [sp.key]: { ...pageData, bgImage: url },
                        },
                      })
                    }
                    recommendedSize="1920x800px"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HEADER, FOOTER & CONTACT                                          */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Brand Identity</span>
              <h2 className="text-lg font-serif text-gray-900">Resort Details & Branding</h2>
              <p className="text-xs text-gray-500">Contact information, custom logo, and social channels shown across all pages.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Resort Brand Name</label>
                  <input
                    type="text"
                    value={content.general.resortName}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        general: { ...content.general, resortName: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    placeholder="Kwalee Beach Resort"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Footer Tagline / Bio</label>
                  <textarea
                    rows={3}
                    value={content.general.tagline}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        general: { ...content.general, tagline: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={content.general.phone}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          general: { ...content.general, phone: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="+231 777 000 000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">WhatsApp Number</label>
                    <input
                      type="text"
                      value={content.general.whatsappNumber}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          general: { ...content.general, whatsappNumber: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="+231 777 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Public Email</label>
                  <input
                    type="email"
                    value={content.general.email}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        general: { ...content.general, email: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    placeholder="info@kwaleebeachresort.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Physical Address</label>
                  <input
                    type="text"
                    value={content.general.address}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        general: { ...content.general, address: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                    placeholder="Kpakpa Kon, Marshall, Liberia"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImagePicker
                  label="Custom Brand Logo (Optional)"
                  value={content.general.logoUrl}
                  onChange={(url) =>
                    setContent({
                      ...content,
                      general: { ...content.general, logoUrl: url },
                    })
                  }
                  description="If left blank, the elegant serif text 'Kwalee' will be used."
                  recommendedSize="300x100px (Transparent PNG)"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Instagram Link</label>
                    <input
                      type="text"
                      value={content.general.instagramUrl}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          general: { ...content.general, instagramUrl: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase">Facebook Link</label>
                    <input
                      type="text"
                      value={content.general.facebookUrl}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          general: { ...content.general, facebookUrl: e.target.value },
                        })
                      }
                      className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase">Copyright Text</label>
                  <input
                    type="text"
                    value={content.general.copyrightText}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        general: { ...content.general, copyrightText: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase">Top Navbar</span>
                <h2 className="text-lg font-serif text-gray-900">Header Navigation Menu Links</h2>
                <p className="text-xs text-gray-500">Edit or reorder the links that appear in the website's top navigation bar.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent({
                    ...content,
                    general: {
                      ...content.general,
                      navLinks: [...content.general.navLinks, { label: 'New Link', href: '/#link' }],
                    },
                  });
                }}
                className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <Plus size={14} /> Add Nav Link
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {content.general.navLinks.map((link, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-600">Link #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.general.navLinks.filter((_, i) => i !== idx);
                        setContent({
                          ...content,
                          general: { ...content.general, navLinks: updated },
                        });
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const updated = [...content.general.navLinks];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setContent({
                          ...content,
                          general: { ...content.general, navLinks: updated },
                        });
                      }}
                      className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                      placeholder="Label (e.g. Stay)"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => {
                        const updated = [...content.general.navLinks];
                        updated[idx] = { ...updated[idx], href: e.target.value };
                        setContent({
                          ...content,
                          general: { ...content.general, navLinks: updated },
                        });
                      }}
                      className="w-full bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F5A623]"
                      placeholder="URL (e.g. /stay)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Save Bar for Quick Access */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Check size={16} className="text-emerald-500" />
          <span>Edit any section above, then click Publish to update kwaleebeachresort.com</span>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#1B2418] hover:bg-[#2C3B27] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? 'Publishing...' : 'Save & Publish Changes'}
        </button>
      </div>
    </div>
  );
}
