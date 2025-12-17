interface PageBackgroundProps {
  imagePath: string;
  className?: string;
}

const PageBackground = ({ imagePath, className = "" }: PageBackgroundProps) => {
  // Fixed opacity for light theme
  const opacity = 0.08;

  return (
    <div 
      className={`fixed inset-0 z-0 transition-opacity duration-500 ${className}`}
      style={{
        backgroundImage: `url('${imagePath}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: opacity,
        filter: 'brightness(1)',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      aria-hidden="true"
    />
  );
};

export default PageBackground;

