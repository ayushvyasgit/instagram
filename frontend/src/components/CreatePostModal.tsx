'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls]     = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState(0);
  const [caption, setCaption]             = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /* ── file helpers ── */
  const addFiles = (files: FileList | File[]) => {
    const next: File[] = [];
    const urls: string[] = [];
    const all = [...selectedFiles];
    for (const f of Array.from(files)) {
      if (all.length + next.length >= 10) break;
      if (f.size > 50 * 1024 * 1024) continue;
      if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) continue;
      next.push(f);
      urls.push(URL.createObjectURL(f));
    }
    setSelectedFiles([...all, ...next]);
    setPreviewUrls(prev => {
      const merged = [...prev, ...urls];
      return merged;
    });
    if (all.length === 0 && next.length > 0) setActivePreview(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previewUrls[i]);
    const nf = selectedFiles.filter((_, j) => j !== i);
    const nu = previewUrls.filter((_, j) => j !== i);
    setSelectedFiles(nf);
    setPreviewUrls(nu);
    if (activePreview >= nu.length) setActivePreview(Math.max(0, nu.length - 1));
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      selectedFiles.forEach(f => fd.append('media', f));
      if (caption) fd.append('caption', caption);
      const { postAPI } = await import('@/src/lib/api');
      await postAPI.createPost(fd);
      onPostCreated();
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setActivePreview(0);
    setCaption('');
    setIsSubmitting(false);
    onClose();
  };

  const isVid = (f: File) => f.type.startsWith('video/');

  return (
    <>
      <style>{`
        /* ── backdrop ── */
        .cpm-bd {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.80);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: cpm-fade .18s ease;
        }
        @keyframes cpm-fade { from { opacity:0 } to { opacity:1 } }

        /* ── modal card ── */
        .cpm-card {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          width: 100%;
          /* Real Instagram: ~860px wide, square-ish height */
          max-width: 860px;
          height: min(90vh, 620px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 32px 96px rgba(0,0,0,0.8);
          animation: cpm-up .22s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes cpm-up {
          from { transform: translateY(16px) scale(0.98); opacity:0 }
          to   { transform: translateY(0)    scale(1);    opacity:1 }
        }

        /* ── header ── */
        .cpm-hd {
          flex-shrink: 0;
          height: 44px;
          display: flex; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 4px;
        }
        .cpm-hd-btn {
          width: 44px; height: 44px;
          background: none; border: none; cursor: pointer;
          color: #e0e0e0;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          transition: background .13s;
          flex-shrink: 0;
        }
        .cpm-hd-btn:hover { background: rgba(255,255,255,0.06); }
        .cpm-hd-btn:disabled { opacity:.35; cursor:not-allowed; }
        .cpm-hd-title {
          flex: 1; text-align: center;
          font-size: 15px; font-weight: 700; color: #f0f0f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .cpm-hd-share {
          width: 64px; height: 44px;
          background: none; border: none; cursor: pointer;
          font-size: 14px; font-weight: 700;
          color: #0095f6;
          font-family: inherit;
          border-radius: 8px;
          transition: background .13s, color .13s;
          flex-shrink: 0;
        }
        .cpm-hd-share:hover { background: rgba(0,149,246,0.1); }
        .cpm-hd-share:disabled { opacity:.3; cursor:not-allowed; }

        /* ── body: left preview + right caption ── */
        .cpm-body {
          flex: 1;
          display: flex;
          min-height: 0;
          overflow: hidden;
        }

        /* ── upload drop zone (no files yet) ── */
        .cpm-drop {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; cursor: pointer;
          transition: background .18s;
        }
        .cpm-drop:hover, .cpm-drop.over { background: rgba(255,255,255,0.03); }
        .cpm-drop-icon {
          width: 80px; height: 80px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          color: #444; margin-bottom: 4px;
          transition: border-color .18s, color .18s;
        }
        .cpm-drop:hover .cpm-drop-icon, .cpm-drop.over .cpm-drop-icon {
          border-color: rgba(255,255,255,0.22); color: #666;
        }
        .cpm-drop-title { font-size: 20px; font-weight: 300; color: #c0c0c0; }
        .cpm-drop-sub   { font-size: 13px; color: #444; }
        .cpm-drop-btn {
          background: #0095f6; color: #fff;
          font-size: 14px; font-weight: 700; font-family: inherit;
          border: none; border-radius: 8px;
          padding: 10px 24px; cursor: pointer;
          transition: background .15s; margin-top: 4px;
        }
        .cpm-drop-btn:hover { background: #1877f2; }

        /* ── media preview pane (left, square) ── */
        .cpm-prev {
          /* square: same as height of card body */
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
          position: relative;
          background: #0d0d0d;
          border-right: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .cpm-prev-img {
          width: 100%; height: 100%; object-fit: contain; display: block;
        }
        .cpm-prev-vid {
          width: 100%; height: 100%; object-fit: contain; display: block;
        }

        /* counter badge */
        .cpm-badge {
          position: absolute; top: 12px; right: 12px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 4px 10px;
          font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.85);
          pointer-events: none;
        }

        /* thumbnail strip at bottom of preview */
        .cpm-thumbs {
          position: absolute; bottom: 10px; left: 10px; right: 10px;
          display: flex; gap: 5px;
          overflow-x: auto; scrollbar-width: none;
          padding: 5px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 10px;
        }
        .cpm-thumbs::-webkit-scrollbar { display:none }
        .cpm-th {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: 7px; overflow: hidden; cursor: pointer;
          border: 2.5px solid transparent;
          opacity: .55; transition: opacity .15s, border-color .15s;
          position: relative;
        }
        .cpm-th.on  { border-color: #0095f6; opacity: 1; }
        .cpm-th:hover { opacity: .85; }
        .cpm-th img, .cpm-th video { width:100%; height:100%; object-fit:cover; display:block; }
        .cpm-th-x {
          position: absolute; top: 2px; right: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(0,0,0,0.72); border: none;
          color: #fff; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; transition: opacity .14s; padding:0;
        }
        .cpm-th:hover .cpm-th-x { opacity: 1; }
        .cpm-th-add {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: 7px;
          border: 2px dashed rgba(255,255,255,0.18);
          background: none; color: #555; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s, color .15s; padding:0;
        }
        .cpm-th-add:hover { border-color: rgba(255,255,255,0.35); color: #999; }

        /* ── caption pane (right) ── */
        .cpm-cap {
          flex: 1;
          display: flex; flex-direction: column;
          min-width: 0; overflow: hidden;
        }

        /* author row */
        .cpm-cap-user {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cpm-cap-av {
          width: 30px; height: 30px; border-radius: 50%;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .cpm-cap-av img { width:100%; height:100%; object-fit:cover }
        .cpm-cap-uname { font-size: 13px; font-weight: 600; color: #f0f0f0; }

        /* textarea */
        .cpm-cap-ta {
          flex: 1;
          background: none; border: none; outline: none; resize: none;
          color: #e0e0e0; font-size: 15px; font-family: inherit;
          line-height: 1.55; padding: 12px 16px;
          min-height: 0;
        }
        .cpm-cap-ta::placeholder { color: #383838; }

        /* footer: char count + extras */
        .cpm-cap-foot {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 10px 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cpm-cap-count { font-size: 11px; color: #383838; text-align: right; }

        /* location / accessibility row (decorative) */
        .cpm-cap-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
        }
        .cpm-cap-row:first-of-type { border-top: none; }
        .cpm-cap-row-label { font-size: 14px; color: #888; }
        .cpm-cap-row-icon  { color: #555; display: flex; }

        @media (max-width: 680px) {
          .cpm-card { height: auto; max-height: 90vh; max-width: 100%; }
          .cpm-body { flex-direction: column; }
          .cpm-prev { aspect-ratio: 1/1; width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .cpm-cap { min-height: 200px; }
        }
      `}</style>

      <div className="cpm-bd" onClick={e => { if (e.target === e.currentTarget) reset(); }}>
        <div className="cpm-card">

          {/* ── Header ── */}
          <div className="cpm-hd">
            {/* back / close btn */}
            <button className="cpm-hd-btn" onClick={reset} disabled={isSubmitting} title="Close">
              {previewUrls.length > 0 ? (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <span className="cpm-hd-title">Create new post</span>

            {previewUrls.length > 0 ? (
              <button className="cpm-hd-share" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '…' : 'Share'}
              </button>
            ) : (
              <div style={{ width: 64 }}/>
            )}
          </div>

          {/* ── Body ── */}
          <div className="cpm-body">

            {previewUrls.length === 0 ? (
              /* ── Drop zone ── */
              <div
                className={`cpm-drop${dragOver ? ' over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="cpm-drop-icon">
                  <svg width="44" height="44" fill="none" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="cpm-drop-title">Drag photos and videos here</span>
                <span className="cpm-drop-sub">Up to 10 files · Max 50 MB each</span>
                <button className="cpm-drop-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Select from computer
                </button>
                <input ref={fileInputRef} type="file" style={{ display:'none' }} accept="image/*,video/*" multiple onChange={handleFileSelect}/>
              </div>

            ) : (
              <>
                {/* ── Left: square media preview ── */}
                <div className="cpm-prev">
                  {isVid(selectedFiles[activePreview]) ? (
                    <video key={activePreview} src={previewUrls[activePreview]}
                      className="cpm-prev-vid" controls muted playsInline/>
                  ) : (
                    <Image src={previewUrls[activePreview]} alt="Preview"
                      fill style={{ objectFit: 'contain' }} unoptimized/>
                  )}

                  {selectedFiles.length > 1 && (
                    <div className="cpm-badge">{activePreview + 1} / {selectedFiles.length}</div>
                  )}

                  {/* thumbnail strip */}
                  <div className="cpm-thumbs">
                    {previewUrls.map((url, i) => (
                      <div key={i} className={`cpm-th${i === activePreview ? ' on' : ''}`} onClick={() => setActivePreview(i)}>
                        {isVid(selectedFiles[i])
                          ? <video src={url} muted/>
                          : <img src={url} alt=""/>
                        }
                        <button className="cpm-th-x" onClick={e => { e.stopPropagation(); removeFile(i); }}>×</button>
                      </div>
                    ))}
                    {selectedFiles.length < 10 && (
                      <button className="cpm-th-add" onClick={() => fileInputRef.current?.click()}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" style={{ display:'none' }} accept="image/*,video/*" multiple onChange={handleFileSelect}/>
                  </div>
                </div>

                {/* ── Right: caption pane ── */}
                <div className="cpm-cap">
                  {/* textarea */}
                  <textarea
                    className="cpm-cap-ta"
                    placeholder="Write a caption…"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    maxLength={2200}
                  />

                  {/* footer */}
                  <div className="cpm-cap-foot">
                    <div className="cpm-cap-count">{caption.length} / 2,200</div>

                    {/* decorative rows like real Instagram */}
                    <div className="cpm-cap-row">
                      <span className="cpm-cap-row-label">Add location</span>
                      <span className="cpm-cap-row-icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/>
                        </svg>
                      </span>
                    </div>
                    <div className="cpm-cap-row">
                      <span className="cpm-cap-row-label">Accessibility</span>
                      <span className="cpm-cap-row-icon">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                    <div className="cpm-cap-row">
                      <span className="cpm-cap-row-label">Advanced settings</span>
                      <span className="cpm-cap-row-icon">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}