import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import getCroppedImg from '../lib/cropImage';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspect?: number;
  cropShape?: 'rect' | 'round';
}

export function ImageCropper({ isOpen, onClose, imageSrc, onCropComplete, aspect = 1, cropShape = 'round' }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels!,
        0 // rotation
      )
      if (croppedImage) {
        onCropComplete(croppedImage)
      }
    } catch (e) {
      console.error(e)
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Image" size="lg">
      <div className="flex flex-col gap-4">
        <div className="relative h-[300px] w-full bg-slate-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
            cropShape={cropShape}
            showGrid={true}
          />
        </div>

        <div className="flex items-center gap-4 px-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={showCroppedImage}>
            Apply Crop
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
