import {
  FC,
  ReactNode
} from 'react';
import Image from 'next/image';
type ImageContainerProps = {
  parentClassName?: string;
  imageClassName?: string;
  src: string | null;
  alt?: string;
  children?: ReactNode;
  priority?: boolean;
  itemProp?: string;
}
export const ImageContainer:FC<ImageContainerProps> = ({
  parentClassName = '',
  imageClassName = '',
  src,
  alt = '',
  children,
  priority = false,
  itemProp = ''
}) => {
  return (
    <div className={`relative ${parentClassName}`}>
      <Image
        src={src ?? "/temp/no-image.svg"}
        className={`${src? 'object-contain' : 'object-cover'} ${imageClassName}`}
        alt={alt}
        fill={true}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
        loading={(!src || priority) ? "eager" : "lazy"}
        itemProp={itemProp}
        quality={100}
        priority={priority}
      />
      {children}
    </div>
  )
}