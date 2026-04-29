"use client";

import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";
import { useBeetleStore } from "@/store/use-beetle-store";
import type { BeetleEntry } from "@/types/beetle";
import { toBase64 } from "@/lib/utils";

export function PhotoSection({ entry }: { entry: BeetleEntry }) {
  const addPhotos = useBeetleStore((state) => state.addPhotos);
  const deletePhoto = useBeetleStore((state) => state.deletePhoto);

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const photos = await Promise.all(files.map(toBase64));
    addPhotos(entry.id, photos);
    event.target.value = "";
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div className="section-title">写真</div>
        <label className="button button-secondary upload-button">
          <Upload size={16} />
          追加
          <input type="file" accept="image/*" capture="environment" hidden onChange={handlePhotoSelect} />
        </label>
      </div>
      {entry.photos.length === 0 ? (
        <p className="empty-text">写真はまだありません。</p>
      ) : (
        <div className="photo-grid">
          {entry.photos.map((photo, index) => (
            <div className="photo-card" key={`${entry.id}-${index}`}>
              <Image src={photo} alt={`${entry.japaneseName} ${index + 1}`} fill unoptimized className="photo-image" />
              <button type="button" className="icon-button danger photo-delete" onClick={() => deletePhoto(entry.id, index)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}