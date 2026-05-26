# PeelImageHolder React Component

A production-ready React component for displaying images in a tall vertical frame with a realistic page-curl/peel effect at the bottom-right corner.

## Features

✅ Tall vertical portrait frame  
✅ Smooth semicircle arch at top  
✅ Straight vertical sides  
✅ Large rounded bottom-left corner  
✅ Realistic red peel/page-curl effect  
✅ Flat, unwarped image (no distortion)  
✅ Red gradient underside for peel  
✅ Soft shadow under peel  
✅ Responsive SVG scaling  
✅ Accessibility support (aria-label)  
✅ Production-ready

## Installation

```jsx
import PeelImageHolder from './PeelImageHolder';
import './PeelImageHolder.css';
```

## Usage

### Basic Usage

```jsx
<PeelImageHolder
  imageSrc="path/to/image.jpg"
  alt="My portrait"
/>
```

### With Custom Styling

```jsx
<PeelImageHolder
  imageSrc="assets/images/portrait.jpeg"
  alt="Profile picture"
  className="custom-class"
  style={{ maxWidth: '300px' }}
/>
```

### In a Container

```jsx
<div style={{ width: '250px' }}>
  <PeelImageHolder
    imageSrc="/images/photo.jpg"
    alt="Journey frame"
  />
</div>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageSrc` | string | required | Image URL or path to display |
| `alt` | string | 'Image' | Alt text for accessibility |
| `className` | string | '' | Additional CSS classes |

## SVG Structure

The component uses:

- **clipPath**: Defines the arched frame shape (vertical sides, arch top, rounded bottom-left)
- **image**: The actual photo, clipped to the frame shape
- **peel paths**: Three layers:
  - Peel shadow (dark gradient underneath)
  - Peel back (red curved underside)
  - Peel highlight (white shine for 3D effect)
- **gradients**: Red gradient for peel color (#ff6b5f → #c51f32 → #6f0f1d)
- **filters**: Gaussian blur shadow for depth

## Responsive Sizing

The component scales to its container:

```jsx
// Small (mobile)
<div style={{ width: '100%', maxWidth: '200px' }}>
  <PeelImageHolder imageSrc={src} alt={alt} />
</div>

// Medium (tablet)
<div style={{ width: '100%', maxWidth: '300px' }}>
  <PeelImageHolder imageSrc={src} alt={alt} />
</div>

// Large (desktop)
<div style={{ width: '100%', maxWidth: '400px' }}>
  <PeelImageHolder imageSrc={src} alt={alt} />
</div>
```

## Styling

The component comes with optional CSS animations:

- Hover effect on peel
- Subtle curl animation
- Dark mode support
- Print styles

Import the CSS file to enable:

```jsx
import './PeelImageHolder.css';
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic SVG with `role="img"`
- `aria-label` prop for screen readers
- Keyboard focus support (with CSS)

## Integration with Existing Project

To integrate into your current website:

1. If using React, install this component directly
2. If using vanilla HTML/JS, convert to React or use as inline SVG reference
3. Update image paths to match your asset structure
4. Customize colors by modifying the gradient stops in the component

## Example Integration

```jsx
// In your journey frames section
import PeelImageHolder from './PeelImageHolder';

export function CeremonyExplorer() {
  return (
    <div className="ceremony-grid">
      <div className="ceremony-feature ceremony-feature--1">
        <PeelImageHolder
          imageSrc="images/picture_7.jpeg"
          alt="By Occasion"
          className="journey-frame"
        />
        <h3>By Occasion</h3>
      </div>

      <div className="ceremony-feature ceremony-feature--2">
        <PeelImageHolder
          imageSrc="images/picture_2.jpeg"
          alt="By Scale"
          className="journey-frame"
        />
        <h3>By Scale</h3>
      </div>

      <div className="ceremony-feature ceremony-feature--3">
        <PeelImageHolder
          imageSrc="images/picture_2.jpeg"
          alt="By Experience"
          className="journey-frame"
        />
        <h3>By Experience</h3>
      </div>
    </div>
  );
}
```

## Customization

To change the peel color, modify the gradient in the component:

```jsx
<linearGradient id="peelRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stopColor="#YourColor1" stopOpacity="1" />
  <stop offset="55%" stopColor="#YourColor2" stopOpacity="1" />
  <stop offset="100%" stopColor="#YourColor3" stopOpacity="1" />
</linearGradient>
```

## Performance Notes

- SVG-based: Crisp at any size
- No image processing overhead
- Single render per component instance
- Optimal for portfolios and galleries

## License

Production-ready component. Free to use and modify.
