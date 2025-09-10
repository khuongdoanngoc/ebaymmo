import React, { useState, useRef } from 'react';

interface MediaViewerProps {
    src: string;
    type: 'image' | 'video';
    className?: string;
    alt?: string;
    onNext?: () => void; // Callback khi click next
    onPrevious?: () => void; // Callback khi click previous
    showNavigation?: boolean; // Hiển thị nút điều hướng
}

export default function MediaViewer({
    src,
    type,
    className = '',
    alt = '',
    onNext,
    onPrevious,
    showNavigation = false
}: MediaViewerProps) {
    const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

    const handleClick = () => {
        if (mediaRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                // Nếu là video thì sử dụng element trực tiếp
                if (type === 'video') {
                    mediaRef.current.requestFullscreen();
                } else {
                    // Nếu là hình ảnh thì wrap trong div để fullscreen
                    const wrapper = document.createElement('div');
                    wrapper.style.backgroundColor = 'black';
                    wrapper.style.display = 'flex';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.justifyContent = 'center';

                    const img = document.createElement('img');
                    img.src = src;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';

                    wrapper.appendChild(img);
                    document.body.appendChild(wrapper);
                    wrapper.requestFullscreen();

                    // Cleanup khi thoát fullscreen
                    wrapper.addEventListener('fullscreenchange', () => {
                        if (!document.fullscreenElement) {
                            document.body.removeChild(wrapper);
                        }
                    });
                }
            }
        }
    };

    const thumbnailClass = `w-48 h-48 object-cover cursor-pointer rounded-lg hover:opacity-90 hover:shadow-lg transition-all duration-300 ${className}`;

    return (
        <div onClick={handleClick} className="overflow-hidden rounded-lg">
            {type === 'image' ? (
                <img
                    ref={mediaRef as React.RefObject<HTMLImageElement>}
                    src={src}
                    alt={alt}
                    className={thumbnailClass}
                />
            ) : (
                <video
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    src={src}
                    className={thumbnailClass}
                    controls
                />
            )}
        </div>
    );
}
