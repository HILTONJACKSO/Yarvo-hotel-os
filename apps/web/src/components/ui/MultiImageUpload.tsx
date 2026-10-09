'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function MultiImageUpload({ images, onChange, maxImages = 50 }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Check limit
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error('Failed to upload image', err);
      }
    }

    onChange([...images, ...uploadedUrls]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 group bg-slate-800">
            <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <Upload size={20} className="mb-1" />
                <span className="text-xs">Upload</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange} 
      />
      
      <p className="text-xs text-slate-500">
        {images.length} / {maxImages} images uploaded
      </p>
    </div>
  );
}
