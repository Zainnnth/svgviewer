"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { CopyIcon, DownloadIcon, UploadIcon, ZapIcon, ImageIcon, XIcon, ClipboardPasteIcon, AlignJustifyIcon, ChevronLeftIcon, ChevronRightIcon, FileIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import CodeEditor from '@/components/code-editor';
import SvgPreview from '@/components/svg-preview';
import { optimizeSvg } from '@/lib/svg-optimizer';
import { GridBackground } from '@/components/grid-background';
import ViewerFaq from '@/components/faq/viewer-faq';
import { beautifySVG } from '@/lib/utils';
import Footer from '@/components/footer';
import Header from '@/components/header';

interface SvgFile {
  name: string;
  content: string;
  size: number;
}

export default function Home() {
  const [svgFiles, setSvgFiles] = useState<SvgFile[]>([
    {
      name: 'welcome.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#1a1a2e"/><circle cx="500" cy="80" r="40" fill="#e94560"/><text x="300" y="150" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="#0f3460">
    WELCOME TO
  </text><text x="300" y="210" font-family="Arial, sans-serif" font-size="50" font-weight="bold" text-anchor="middle" fill="#e94560">
    SVGViewer.app
  </text><rect x="200" y="250" width="200" height="50" rx="25" fill="#e94560"/><text x="300" y="285" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#ffffff">
    VISIT NOW
  </text><text x="300" y="350" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#ffffff">
    https://svgviewer.app
  </text></svg>`,
      size: 0,
    }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [optimizedSize, setOptimizedSize] = useState<number>(0);
  const [optimizedCode, setOptimizedCode] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [mobileView, setMobileView] = useState<'code' | 'preview'>('preview');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  
  const { toast } = useToast();

  const activeFile = svgFiles[activeFileIndex];
  const svgCode = activeFile?.content || '';

  useEffect(() => {
    if (svgCode) {
      setOriginalSize(new Blob([svgCode]).size);
      const optimized = optimizeSvg(svgCode);
      setOptimizedCode(optimized);
      setOptimizedSize(new Blob([optimized]).size);
    }
  }, [svgCode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMobileView('preview');
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const fileReaders = Array.from(files).map(file => {
        return new Promise<SvgFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            resolve({
              name: file.name,
              content,
              size: file.size,
            });
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      });

      const newFiles = await Promise.all(fileReaders);
      setSvgFiles(prev => [...prev, ...newFiles]);
      setActiveFileIndex(svgFiles.length); // Set active to first newly uploaded file
      
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} SVG file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to read one or more files",
        variant: "destructive",
      });
    }

    // Reset input
    e.target.value = '';
  };

  const handleSvgCodeChange = (newCode: string) => {
    setSvgFiles(prev => {
      const updated = [...prev];
      updated[activeFileIndex] = {
        ...updated[activeFileIndex],
        content: newCode,
      };
      return updated;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "SVG code has been copied to your clipboard",
    });
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setSvgFiles(prev => {
      const updated = [...prev];
      updated[activeFileIndex] = {
        ...updated[activeFileIndex],
        content: '',
      };
      return updated;
    });
    toast({
      title: "Cleared",
      description: "SVG code has been cleared",
    });
  };

  const handleFormat = () => {
    handleSvgCodeChange(beautifySVG(svgCode));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleSvgCodeChange(text);
      toast({
        title: "Pasted from clipboard",
        description: "SVG code has been pasted from your clipboard",
      });
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Failed to read from clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = (index: number) => {
    if (svgFiles.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must keep at least one file",
        variant: "destructive",
      });
      return;
    }

    setSvgFiles(prev => prev.filter((_, i) => i !== index));
    
    if (activeFileIndex === index) {
      setActiveFileIndex(Math.max(0, index - 1));
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1);
    }

    toast({
      title: "File deleted",
      description: "SVG file has been removed",
    });
  };

  const handlePrevious = () => {
    setActiveFileIndex(prev => (prev === 0 ? svgFiles.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveFileIndex(prev => (prev === svgFiles.length - 1 ? 0 : prev + 1));
  };

  const handleSelectFile = (index: number) => {
    setActiveFileIndex(index);
    // Close sidebar on mobile after selecting
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/80">

      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-8.5rem)]">
        <div className="flex flex-col gap-6 h-full">
          <div className="text-center max-w-3xl mx-auto mb-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">SVG Viewer & Editor</h1>
            <p className="text-muted-foreground text-base md:text-lg">A powerful online tool to view, edit, and optimize your SVG files in real-time.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg shadow-sm gradient-border">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="gap-2 shadow-sm text-sm h-9 md:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? 'Hide' : 'Show'} Files
              </Button>
              <Button
                variant="outline"
                className="gap-2 shadow-sm text-sm h-9"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <UploadIcon className="h-4 w-4" />
                Upload SVG(s)
                <input
                  id="file-upload"
                  type="file"
                  accept=".svg,image/svg+xml"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Button>
              <Button
                variant="outline"
                className="gap-2 shadow-sm text-sm h-9"
                onClick={() => handleDownload(svgCode, activeFile?.name || 'download.svg')}
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </Button>
            </div>
            
            <div className="flex items-center gap-3 mt-3 md:mt-0 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom:</span>
                <Slider
                  value={[zoom]}
                  min={10}
                  max={200}
                  step={10}
                  onValueChange={(value) => setZoom(value[0])}
                  className="w-full md:w-32"
                />
                <span className="text-sm w-12">{zoom}%</span>
              </div>
            </div>
          </div>

          {/* File Manager Panel */}
          {showSidebar && (
            <div className="bg-card border rounded-lg p-4 shadow-sm gradient-border max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-3">Uploaded Files ({svgFiles.length})</h3>
              <div className="space-y-2">
                {svgFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      activeFileIndex === index
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-background hover:bg-muted border border-transparent'
                    }`}
                    onClick={() => handleSelectFile(index)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(index);
                      }}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {svgFiles.length > 1 && (
            <div className="flex items-center justify-between bg-card p-3 rounded-lg shadow-sm gradient-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handlePrevious}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {activeFileIndex + 1} / {svgFiles.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleNext}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 使用响应式布局 */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Code Editor */}
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">SVG Code</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFormat}
                    className="hover:bg-primary/10 h-7 px-2"
                  >
                    <AlignJustifyIcon className="h-3.5 w-3.5 mr-1" />
                    Format
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="hover:bg-primary/10 h-7 px-2"
                  >
                    <XIcon className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(svgCode)}
                    className="hover:bg-primary/10 h-7 px-2"
                  >
                    <CopyIcon className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePaste}
                    className="hover:bg-primary/10 h-7 px-2"
                  >
                    <ClipboardPasteIcon className="h-3.5 w-3.5 mr-1" />
                    Paste
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden flex-1 min-h-0 shadow-md gradient-border">
                <CodeEditor value={svgCode} onChange={handleSvgCodeChange} />
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Preview</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Size: {originalSize} bytes</span>
                  {optimizedSize !== originalSize && (
                    <span className={`ml-2 ${optimizedSize < originalSize ? 'text-green-500' : 'text-red-500'}`}>
                      ({optimizedSize < originalSize ? '-' : '+'}
                      {Math.abs(Math.round((1 - optimizedSize / originalSize) * 100))}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden relative flex-1 min-h-0 flex items-center justify-center shadow-md gradient-border bg-white dark:bg-black">
                <GridBackground />
                <SvgPreview 
                  svgCode={svgCode} 
                  zoom={zoom} 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center my-6">
            <Button variant="default" className="gap-2 shadow-md text-sm h-9" onClick={() => handleDownload(svgCode, activeFile?.name || 'download.svg')}>
              <DownloadIcon className="h-4 w-4" />
              Download SVG
            </Button>
            <Button variant="outline" className="gap-2 shadow-sm text-sm h-9" onClick={() => handleCopy(svgCode)}>
              <CopyIcon className="h-4 w-4" />
              Copy SVG
            </Button>
            <Button asChild variant="outline" className="gap-2 shadow-sm text-sm h-9">
              <Link href="/svg-optimizer" title='SVG Optimizer'>
                <ZapIcon className="h-4 w-4" />
                Optimize SVG
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 shadow-sm text-sm h-9">
              <Link href="/svg-converter" title='SVG Converter'>
                <ImageIcon className="h-4 w-4" />
                Convert SVG
              </Link>
            </Button>
          </div>
        </div>
        
        <ViewerFaq />
      </main>

      <Footer />
    </div>
  );
}
