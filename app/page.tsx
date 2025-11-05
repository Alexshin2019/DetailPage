"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Download, RefreshCw, Baby, Utensils, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";

// 배경 색상 옵션
const BACKGROUND_COLORS = [
  { name: "흰색", value: "#ffffff", textColor: "#000000" },
  { name: "회색", value: "#2a2a2a", textColor: "#ffffff" },
  { name: "파란색", value: "#3b82f6", textColor: "#ffffff" },
  { name: "노란색", value: "#fbbf24", textColor: "#000000" },
  { name: "베이지", value: "#fafafa", textColor: "#000000" },
  { name: "연한 파랑", value: "#dbeafe", textColor: "#000000" },
  { name: "연한 노랑", value: "#fef3c7", textColor: "#000000" },
  { name: "진한 회색", value: "#1f2937", textColor: "#ffffff" },
  { name: "빨간색", value: "#ef4444", textColor: "#ffffff" },
  { name: "주황색", value: "#f97316", textColor: "#ffffff" },
  { name: "초록색", value: "#22c55e", textColor: "#ffffff" },
  { name: "진한 초록", value: "#16a34a", textColor: "#ffffff" },
  { name: "연한 초록", value: "#d1fae5", textColor: "#000000" },
  { name: "보라색", value: "#a855f7", textColor: "#ffffff" },
  { name: "연한 보라", value: "#e9d5ff", textColor: "#000000" },
  { name: "분홍색", value: "#ec4899", textColor: "#ffffff" },
  { name: "연한 분홍", value: "#fce7f3", textColor: "#000000" },
  { name: "진한 파랑", value: "#1e40af", textColor: "#ffffff" },
  { name: "하늘색", value: "#06b6d4", textColor: "#ffffff" },
  { name: "연한 하늘", value: "#cffafe", textColor: "#000000" },
  { name: "갈색", value: "#92400e", textColor: "#ffffff" },
  { name: "연한 갈색", value: "#fef3c7", textColor: "#000000" },
  { name: "진한 빨강", value: "#dc2626", textColor: "#ffffff" },
  { name: "연한 빨강", value: "#fee2e2", textColor: "#000000" },
  { name: "청록색", value: "#14b8a6", textColor: "#ffffff" },
  { name: "연한 청록", value: "#ccfbf1", textColor: "#000000" },
  { name: "라임색", value: "#84cc16", textColor: "#000000" },
  { name: "연한 라임", value: "#ecfccb", textColor: "#000000" },
  { name: "인디고", value: "#6366f1", textColor: "#ffffff" },
  { name: "연한 인디고", value: "#e0e7ff", textColor: "#000000" },
  { name: "진한 보라", value: "#7e22ce", textColor: "#ffffff" },
  { name: "로즈", value: "#f43f5e", textColor: "#ffffff" },
  { name: "연한 로즈", value: "#ffe4e6", textColor: "#000000" },
];

// 섹션별 데이터 타입 정의
interface Section {
  type: "hero" | "description" | "point" | "summary" | "reviews" | "cta";
  title?: string;
  subtitle?: string;
  description?: string;
  copywriter?: string; // 카피라이터
  subCopywriter?: string; // 서브 카피라이터
  pointNumber?: string;
  decorativeText?: string;
  backgroundColor?: string;
  textColor?: string;
  productImage?: string; // 제품 이미지
  position?: "left" | "right"; // 지그재그 배치를 위한 위치
  reviews?: Array<{ // 후기 및 추천 섹션용
    userId: string;
    rating: number;
    content: string;
  }>;
  imageConcept?: string; // CTA 섹션용 이미지 컨셉 설명
}

// 상세페이지 데이터 타입 정의
interface ProductDetail {
  brandName?: string;
  title: string;
  mainDescription: string;
  sections: Section[];
}

// 제품 카테고리
const PRODUCT_CATEGORIES = [
  {
    id: "baby",
    name: "유아용품",
    subtitle: "소중한 우리 아이를 위한",
    icon: Baby,
    gradient: "from-purple-400 to-purple-600",
  },
  {
    id: "food",
    name: "식품",
    subtitle: "안전하고 맛있는 식품",
    icon: Utensils,
    gradient: "from-green-400 to-blue-500",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"thumbnail" | "detail">("detail"); // 선택된 탭
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 선택된 카테고리
  const [productInput, setProductInput] = useState(""); // 사용자 입력 제품명
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({}); // 섹션별 선택된 배경색
  const [hiddenSections, setHiddenSections] = useState<Record<number, boolean>>({}); // 섹션별 숨김 상태
  const [productImage, setProductImage] = useState<string | null>(null); // 첫 페이지 제품 이미지
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDetail, setGeneratedDetail] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingHTML, setIsDownloadingHTML] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 클라이언트에서만 렌더링되도록 처리
  // Hydration 에러 방지를 위해 서버에서는 빈 div 반환
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  // 배경 색상 변경 핸들러
  const handleColorChange = (sectionIndex: number, color: typeof BACKGROUND_COLORS[0]) => {
    setSelectedColors((prev) => ({
      ...prev,
      [sectionIndex]: color.value,
    }));
  };

  // 상세페이지 생성 함수
  const handleGenerate = async () => {
    if (!productInput.trim()) {
      setError("제품명을 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productInput.trim(),
          category: null, // 카테고리 선택 제거
          productImage: productImage || null, // 첫 페이지에서 업로드한 제품 이미지 전달
        }),
      });

      if (!response.ok) {
        let errorMessage = "상세페이지 생성에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 상태 코드로 에러 메시지 생성
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("생성된 상세페이지 데이터:", data);
      
      // 데이터 검증
      if (!data || !data.sections || !Array.isArray(data.sections)) {
        throw new Error("서버에서 잘못된 데이터를 받았습니다.");
      }
      
      // 이미지 로드 상태 초기화
      const initialImageStates: Record<string, 'loading' | 'loaded' | 'error'> = {};
      if (data.sections) {
        data.sections.forEach((section: Section, idx: number) => {
          if (section.productImage) {
            initialImageStates[`${idx}-${section.type}`] = 'loading';
          }
        });
      }
      setImageLoadStates(initialImageStates);
      
      setGeneratedDetail(data);
    } catch (err) {
      console.error("상세페이지 생성 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 이미지를 Base64로 변환하는 함수
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 이미 Base64인 경우 그대로 반환
      if (url.startsWith('data:')) {
        resolve(url);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS 문제 해결
      
      let resolved = false;
      
      // 타임아웃 설정 (15초로 증가)
      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        console.warn('이미지 로드 타임아웃:', url);
        // 타임아웃 시에도 원본 URL 반환
        resolve(url);
      }, 15000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        if (resolved) return;
        resolved = true;
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context를 생성할 수 없습니다.'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/png');
          console.log('이미지 Base64 변환 성공:', url.substring(0, 50));
          resolve(base64);
        } catch (error) {
          console.error('이미지 변환 오류:', error);
          // 변환 실패 시에도 원본 URL 반환 (html2canvas가 처리하도록)
          resolve(url);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        if (resolved) return;
        resolved = true;
        console.error('이미지 로드 실패:', url);
        // 실패 시 원본 URL 반환 (html2canvas가 처리하도록)
        resolve(url);
      };
      
      img.src = url;
    });
  };

  // Tailwind 클래스에서 색상 추출 (간단한 버전)
  const getComputedColorFromClass = (className: string): string | null => {
    // 주요 Tailwind 색상 매핑
    const colorMap: Record<string, string> = {
      'bg-white': '#ffffff',
      'bg-gray-100': '#f3f4f6',
      'bg-gray-200': '#e5e7eb',
      'bg-gray-300': '#d1d5db',
      'bg-indigo-600': '#4f46e5',
      'bg-purple-600': '#9333ea',
      'bg-red-500': '#ef4444',
      'bg-yellow-500': '#eab308',
      'bg-green-500': '#22c55e',
    };
    return colorMap[className] || null;
  };

  // HTML 다운로드 함수 - 이미지를 Base64로 변환하여 포함
  const handleDownload = async () => {
    if (!generatedDetail) return;

    setIsDownloadingHTML(true);
    setError(null);

    try {
      // 모든 섹션의 이미지를 Base64로 변환 (재시도 로직 포함)
      // HTML 다운로드는 반드시 Base64로 변환해야 함 (외부 URL은 파일에서 접근 불가)
      const sectionsWithBase64Images = await Promise.all(
        generatedDetail.sections.map(async (section) => {
          if (section.productImage) {
            // 이미 Base64인 경우 그대로 사용
            if (section.productImage.startsWith('data:')) {
              console.log(`이미지 이미 Base64 (섹션 ${section.type})`);
              return section;
            }
            
            // Base64 변환 시도 (최대 5회 재시도)
            let lastError: Error | null = null;
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                console.log(`이미지 변환 시도 중 (섹션 ${section.type}, 시도 ${attempt + 1}/5)...`);
                const base64Image = await imageToBase64(section.productImage);
                // Base64 변환 성공 확인
                if (base64Image && base64Image.startsWith('data:')) {
                  console.log(`이미지 변환 성공 (섹션 ${section.type}, 시도 ${attempt + 1})`);
                  return {
                    ...section,
                    productImage: base64Image,
                  };
                }
              } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`이미지 변환 실패 (섹션 ${section.type}, 시도 ${attempt + 1}/5):`, lastError);
                // 재시도 전 대기 (점진적 증가)
                if (attempt < 4) {
                  await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
                }
              }
            }
            
            // 모든 재시도 실패 시 SVG 플레이스홀더 이미지 사용
            console.error(`이미지 변환 최종 실패 (섹션 ${section.type}):`, lastError);
            const productName = section.title || generatedDetail.title || '제품';
            const placeholderSVG = createPlaceholderSVG(productName, 780, 400);
            return {
              ...section,
              productImage: placeholderSVG,
            };
          }
          // productImage가 없을 때도 SVG 플레이스홀더 생성
          if (section.type === 'hero' || section.type === 'description' || section.type === 'point' || section.type === 'summary' || section.type === 'cta') {
            const productName = section.title || generatedDetail.title || '제품';
            const placeholderSVG = createPlaceholderSVG(productName, 780, 400);
            return {
              ...section,
              productImage: placeholderSVG,
            };
          }
          return section;
        })
      );

      const detailWithBase64Images = {
        ...generatedDetail,
        sections: sectionsWithBase64Images,
      };

      const htmlContent = generateHTML(detailWithBase64Images);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${generatedDetail.title.replace(/\s+/g, "_")}_상세페이지.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('HTML 다운로드 오류:', error);
      setError(`HTML 다운로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsDownloadingHTML(false);
    }
  };

  // 이미지 다운로드 함수 - HTML 페이지를 이미지로 변환
  const handleDownloadImage = async () => {
    if (!generatedDetail) return;

    setIsDownloadingImage(true);
    setError(null);

    try {
      // 1. 모든 이미지를 Base64로 변환 (재시도 로직 포함)
      const sectionsWithBase64Images = await Promise.all(
        generatedDetail.sections.map(async (section) => {
          if (section.productImage) {
            try {
              // 이미 Base64인 경우 그대로 사용
              if (section.productImage.startsWith('data:')) {
                return section;
              }
              
              // 외부 URL인 경우 Base64로 변환 시도
              const base64Image = await imageToBase64(section.productImage);
              if (base64Image && base64Image.startsWith('data:')) {
                console.log(`이미지 변환 성공 (섹션 ${section.type})`);
                return {
                  ...section,
                  productImage: base64Image,
                };
              } else {
                console.warn(`이미지 변환 실패 - 원본 URL 사용 (섹션 ${section.type})`);
                return section;
              }
            } catch (error) {
              console.error(`이미지 변환 오류 (섹션 ${section.type}):`, error);
              // 변환 실패 시 원본 URL 사용
              return section;
            }
          }
          return section;
        })
      );

      const detailWithBase64Images = {
        ...generatedDetail,
        sections: sectionsWithBase64Images,
      };

      // 2. HTML 생성 (다운로드용 - generateHTML 사용하되 스타일 개선)
      const htmlContent = generateHTML(detailWithBase64Images);

      // 3. 임시 iframe 생성하여 HTML 렌더링
      const iframe = document.createElement('iframe');
      iframe.id = 'temp-html-renderer-' + Date.now();
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '860px';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.height = '10000px'; // 충분한 높이 확보
      iframe.style.overflow = 'hidden';
      
      document.body.appendChild(iframe);

      // iframe에 HTML 내용 쓰기
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("iframe 문서를 가져올 수 없습니다.");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // iframe 문서의 스타일 강제 적용
      if (iframeDoc.body) {
        iframeDoc.body.style.width = '860px';
        iframeDoc.body.style.margin = '0 auto';
        iframeDoc.body.style.padding = '0';
        iframeDoc.body.style.overflow = 'hidden';
      }
      
      // iframe 문서의 html 요소도 설정
      if (iframeDoc.documentElement) {
        iframeDoc.documentElement.style.width = '860px';
        iframeDoc.documentElement.style.margin = '0';
        iframeDoc.documentElement.style.padding = '0';
      }

      // 4. iframe 내부의 모든 이미지가 로드될 때까지 대기 (개선된 로직)
      await new Promise<void>((resolve) => {
        // DOM이 완전히 로드될 때까지 대기
        setTimeout(() => {
          const images = iframeDoc.querySelectorAll('img');
          const totalImages = images.length;

          if (totalImages === 0) {
            console.log('이미지가 없습니다. 바로 진행');
            resolve();
            return;
          }

          console.log(`총 ${totalImages}개의 이미지 로드 대기 중...`);

          let loadedCount = 0;

          const checkComplete = () => {
            loadedCount++;
            console.log(`이미지 로드 상태: ${loadedCount}/${totalImages}`);
            
            if (loadedCount >= totalImages) {
              // 추가 대기 시간 (렌더링 완료 대기)
              setTimeout(() => {
                console.log('모든 이미지 처리 완료, 캡처 시작');
                resolve();
              }, 2000); // 2초 대기
            }
          };

          images.forEach((img: HTMLImageElement, index) => {
            // 이미지가 Base64인 경우 강제로 새로 로드
            if (img.src.startsWith('data:')) {
              // Base64 이미지는 새 Image 객체로 강제 로드
              const newImg = new Image();
              newImg.onload = () => {
                img.src = newImg.src;
                // 이미지가 DOM에 반영되도록 강제
                img.style.display = 'block';
                img.style.visibility = 'visible';
                img.style.opacity = '1';
                console.log(`이미지 ${index + 1} (Base64) 로드 완료`);
                checkComplete();
              };
              newImg.onerror = () => {
                console.warn(`이미지 ${index + 1} (Base64) 로드 실패`);
                checkComplete();
              };
              newImg.src = img.src;
              return;
            }

            // 외부 이미지 처리
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              console.log(`이미지 ${index + 1} 이미 로드됨`);
              checkComplete();
            } else {
              img.onload = () => {
                console.log(`이미지 ${index + 1} 로드 완료`);
                checkComplete();
              };
              img.onerror = () => {
                console.warn(`이미지 ${index + 1} 로드 실패: ${img.src.substring(0, 50)}`);
                checkComplete();
              };
              
              // src가 없으면 즉시 완료 처리
              if (!img.src || img.src === '') {
                console.warn(`이미지 ${index + 1} src가 없음`);
                checkComplete();
              }
            }
          });

          // 타임아웃 설정 (최대 30초)
          setTimeout(() => {
            console.warn(`이미지 로드 타임아웃 (${loadedCount}/${totalImages}), 진행`);
            resolve();
          }, 30000);
        }, 500); // DOM 로드 대기
      });

      // 5. iframe의 body 요소를 찾아서 캡처
      const bodyElement = iframeDoc.body;
      if (!bodyElement) {
        throw new Error("iframe body를 찾을 수 없습니다.");
      }

      // 6. html2canvas로 캡처 (Base64 이미지 최적화 설정)
      const canvas = await html2canvas(bodyElement, {
        useCORS: true, // Base64 이미지도 포함하므로 true
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true, // Base64 이미지 허용
        foreignObjectRendering: true, // 외부 리소스 렌더링 허용
        imageTimeout: 0, // 이미 로드 완료
        removeContainer: false,
        scale: 2, // 고해상도
        width: 860,
        height: bodyElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 860,
        windowHeight: bodyElement.scrollHeight,
        proxy: undefined, // 프록시 사용 안 함
        onclone: (clonedDoc: Document) => {
          // 클론된 문서에서 이미지가 제대로 있는지 확인
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img: HTMLImageElement) => {
            // 이미지가 로드되지 않았거나 src가 없으면 로그
            if (!img.src || img.src === '' || (!img.complete && !img.src.startsWith('data:'))) {
              console.warn('클론된 문서에서 이미지 문제 발견:', img.alt || '이미지');
            }
            // Base64 이미지 강제 로드
            if (img.src.startsWith('data:')) {
              const newImg = new Image();
              newImg.src = img.src;
              newImg.onload = () => {
                img.src = newImg.src;
              };
            }
          });
        },
      } as any);

      // 7. 캔버스를 860px 너비로 리사이즈 (비율 유지)
      const targetWidth = 860;
      const scale = targetWidth / canvas.width;
      const targetHeight = Math.ceil(canvas.height * scale);
      
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = targetWidth;
      resizedCanvas.height = targetHeight;
      const ctx = resizedCanvas.getContext('2d');

      if (!ctx) {
        throw new Error("Canvas context 생성 실패");
      }

      // 고품질 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 흰색 배경 채우기
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 원본 이미지를 860px 너비에 맞춰 비율 유지하며 그리기
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);

      // 8. PNG 이미지로 다운로드 (고품질)
      resizedCanvas.toBlob((blob) => {
        if (!blob) {
          setIsDownloadingImage(false);
          setError("이미지를 생성할 수 없습니다.");
          return;
        }
        
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          // 파일명에서 특수문자 제거
          const safeFileName = generatedDetail.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').replace(/\s+/g, '_');
          link.download = `${safeFileName}_상세페이지.png`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // 다운로드 후 정리
          setTimeout(() => {
            if (link.parentNode) {
              document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
            setIsDownloadingImage(false);
          }, 100);
        } catch (error) {
          console.error("다운로드 오류:", error);
          setIsDownloadingImage(false);
          setError(`이미지 다운로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      }, "image/png", 1.0); // PNG 형식, 최고 품질
      
      // iframe 제거 (비동기로 처리)
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    } catch (error) {
      console.error("이미지 다운로드 오류:", error);
      setError(`이미지 다운로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsDownloadingImage(false);
      
      // 에러 발생 시에도 iframe 정리
      const iframes = document.querySelectorAll('iframe[id^="temp-html-renderer-"]');
      iframes.forEach((iframe) => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      });
    }
  };

  // SVG 기반 플레이스홀더 이미지 생성 함수
  const createPlaceholderSVG = (text: string = "이미지", width: number = 600, height: number = 400): string => {
    // SVG 문자열 생성
    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    
    // URL 인코딩하여 data URL로 변환
    const encodedSvg = encodeURIComponent(svgContent);
    return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  };

  // 이미지 로딩 실패 핸들러
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, sectionIndex: number, sectionType: string) => {
    const img = e.currentTarget;
    const originalSrc = img.src;
    
    // 이미 SVG 플레이스홀더인 경우 무시
    if (originalSrc.startsWith('data:image/svg+xml')) {
      return;
    }
    
    // Base64 이미지인 경우 에러 로그만 출력하고 무시
    if (originalSrc.startsWith('data:image/')) {
      console.warn(`Base64 이미지 로드 실패 (섹션 ${sectionIndex}, ${sectionType}), 플레이스홀더로 교체`);
    } else {
      console.error(`이미지 로드 실패 (섹션 ${sectionIndex}, ${sectionType}):`, originalSrc.substring(0, 100));
    }
    
    // 이미지 로드 상태 업데이트
    setImageLoadStates(prev => ({
      ...prev,
      [`${sectionIndex}-${sectionType}`]: 'error'
    }));
    
    // 무한 루프 방지
    img.onerror = null;
    
    // 로딩 인디케이터 제거
    const parent = img.parentElement;
    if (parent) {
      const loadingIndicator = parent.querySelector('.image-loading');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
    
    // SVG 기반 플레이스홀더로 교체 (제품명 포함)
    // Placeholder.com이나 다른 외부 이미지 실패 시 즉시 SVG로 교체
    const productName = generatedDetail?.title || '제품';
    const placeholderSVG = createPlaceholderSVG(`${productName} 이미지`, 600, 400);
    
    // 이미지 교체 전 src 백업 (Placeholder.com 등 실패한 URL 저장)
    const backupSrc = img.src;
    img.src = placeholderSVG;
    
    // 플레이스홀더도 실패하면 빈 이미지로 처리
    setTimeout(() => {
      if (img.src === placeholderSVG && !img.complete) {
        img.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-center p-4 text-gray-400';
        errorDiv.textContent = '이미지를 불러올 수 없습니다';
        if (img.parentElement) {
          img.parentElement.appendChild(errorDiv);
        }
      }
    }, 1000);
  };

  // 이미지 로딩 성공 핸들러
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>, sectionIndex: number, sectionType: string) => {
    const img = e.currentTarget;
    console.log(`이미지 로드 성공 (섹션 ${sectionIndex}, ${sectionType}):`, img.src.substring(0, 100));
    
    // 이미지 로드 상태 업데이트
    setImageLoadStates(prev => ({
      ...prev,
      [`${sectionIndex}-${sectionType}`]: 'loaded'
    }));
    
    // 이미지가 확실히 표시되도록 설정
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    
    // 이미지가 로드되면 부모 요소의 로딩 상태 제거
    const parent = img.parentElement;
    if (parent) {
      const loadingIndicators = parent.querySelectorAll('.image-loading, [class*="loading"], [class*="Loader"], [class*="spinner"], .animate-spin');
      loadingIndicators.forEach((indicator) => {
        (indicator as HTMLElement).style.display = 'none';
        (indicator as HTMLElement).style.visibility = 'hidden';
        indicator.remove();
      });
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (sectionIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      setGeneratedDetail((prev) => {
        if (!prev) return null;
        const updatedSections = [...prev.sections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          productImage: base64Image,
        };
        return { ...prev, sections: updatedSections };
      });
      setError(null);
    };
    reader.onerror = () => {
      setError("이미지 파일을 읽는 중 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  // HTML 생성 함수
  const generateHTML = (detail: ProductDetail): string => {
    // 제목을 파일명에 안전하게 사용할 수 있도록 변환
    const safeFileName = detail.title.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    
    // 숨김 처리된 섹션을 제외하고 HTML 생성
    const sectionsHTML = detail.sections
      .map((section, idx) => {
        // 숨김 처리된 섹션은 HTML에 포함하지 않음
        if (hiddenSections[idx]) {
          return "";
        }
        
        const isLeft = section.position === "left";

        switch (section.type) {
          case "hero":
            return `
              <section class="section-hero" style="background: ${section.backgroundColor || "#ffffff"}; color: ${section.textColor || "#000"}; padding: 100px 40px; text-align: center; width: 860px; margin: 0 auto;">
                <div class="hero-content" style="width: 100%; margin: 0 auto;">
                  ${section.subtitle ? `<div class="hero-subtitle" style="font-size: 1.2em; margin-bottom: 20px; opacity: 0.8;">${section.subtitle}</div>` : ""}
                  <h1 class="hero-title" style="font-size: 3.5em; font-weight: bold; margin-bottom: 30px; line-height: 1.2;">${section.title || detail.title}</h1>
                  ${section.description ? `<p class="hero-description" style="font-size: 1.3em; line-height: 1.8; margin: 0 auto;">${section.description}</p>` : ""}
                  ${section.copywriter ? `<p class="hero-copywriter" style="font-size: 1.5em; font-weight: 600; margin: 30px 0;">${section.copywriter}</p>` : ""}
                  ${section.productImage ? `<div style="margin-top: 50px; display: flex; justify-content: center; align-items: center; width: 100%;"><img src="${section.productImage}" alt="${detail.title}" style="max-width: 780px; width: 100%; height: auto; border-radius: 20px; display: block; object-fit: contain; margin: 0 auto;" ${section.productImage.startsWith('data:') ? '' : 'crossorigin="anonymous"'} /></div>` : ""}
                </div>
              </section>
            `;

          case "description":
            return `
              <section class="section-description" style="background: ${section.backgroundColor || "#ffffff"}; color: ${section.textColor || "#000"}; padding: 80px 40px; width: 860px; margin: 0 auto;">
                <div class="container" style="width: 100%; margin: 0 auto; text-align: center;">
                  ${section.title ? `<h2 style="font-size: 2.5em; font-weight: bold; margin-bottom: 30px;">${section.title}</h2>` : ""}
                  ${section.copywriter ? `<p style="font-size: 1.5em; font-weight: 600; margin-bottom: 20px; color: ${section.textColor || "#000"}; opacity: 0.9;">${section.copywriter}</p>` : ""}
                  ${section.description ? `<p style="font-size: 1.1em; line-height: 1.8; white-space: pre-line; margin-bottom: 30px;">${section.description}</p>` : ""}
                  ${section.productImage ? `<div style="margin-top: 30px; display: flex; justify-content: center; align-items: center; width: 100%;"><img src="${section.productImage}" alt="제품 이미지" style="max-width: 780px; width: 100%; height: auto; border-radius: 15px; display: block; object-fit: contain; margin: 0 auto;" ${section.productImage.startsWith('data:') ? '' : 'crossorigin="anonymous"'} /></div>` : ""}
                </div>
              </section>
            `;

          case "point":
            return `
              <section class="section-point" style="background: ${section.backgroundColor || "#ffffff"}; color: ${section.textColor || "#000"}; padding: 80px 40px; width: 860px; margin: 0 auto;">
                <div class="point-content" style="width: 100%; margin: 0 auto;">
                  <div style="margin-bottom: 30px;">
                    ${section.pointNumber ? `<div style="font-size: 0.9em; font-weight: bold; margin-bottom: 20px; opacity: 0.7; letter-spacing: 2px;">${section.pointNumber}</div>` : ""}
                    ${section.title ? `<h2 style="font-size: 2.2em; font-weight: bold; margin-bottom: 20px;">${section.title}</h2>` : ""}
                    ${section.copywriter ? `<p style="font-size: 1.4em; font-weight: 600; margin-bottom: 20px; color: ${section.textColor || "#000"}; opacity: 0.9;">${section.copywriter}</p>` : ""}
                    ${section.description ? `<p style="font-size: 1.1em; line-height: 1.8; white-space: pre-line; position: relative;">${section.description}</p>` : ""}
                  </div>
                  ${section.productImage ? `<div style="margin-top: 30px; display: flex; justify-content: center; align-items: center; width: 100%;"><img src="${section.productImage}" alt="제품 이미지" style="max-width: 780px; width: 100%; height: auto; border-radius: 15px; display: block; object-fit: contain; margin: 0 auto;" ${section.productImage.startsWith('data:') ? '' : 'crossorigin="anonymous"'} /></div>` : ""}
                </div>
              </section>
            `;

          case "summary":
            return `
              <section class="section-summary" style="background: ${section.backgroundColor || "#fafafa"}; color: ${section.textColor || "#000"}; padding: 80px 40px; text-align: center; width: 860px; margin: 0 auto;">
                <div class="container" style="width: 100%; margin: 0 auto;">
                  ${section.title ? `<h2 style="font-size: 2.5em; font-weight: bold; margin-bottom: 30px;">${section.title}</h2>` : ""}
                  ${section.copywriter ? `<p style="font-size: 1.6em; font-weight: 600; margin-bottom: 30px; color: ${section.textColor || "#000"}; opacity: 0.9;">${section.copywriter}</p>` : ""}
                  ${section.description ? `<p style="font-size: 1.2em; line-height: 1.8; white-space: pre-line;">${section.description}</p>` : ""}
                  ${section.productImage ? `<div style="margin-top: 50px; display: flex; justify-content: center; align-items: center; width: 100%;"><img src="${section.productImage}" alt="제품 이미지" style="max-width: 780px; width: 100%; height: auto; border-radius: 20px; display: block; object-fit: contain; margin: 0 auto;" ${section.productImage.startsWith('data:') ? '' : 'crossorigin="anonymous"'} /></div>` : ""}
                </div>
              </section>
            `;

          case "reviews":
            const reviewsHTML = section.reviews?.map((review) => `
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-weight: 600; color: ${section.textColor || "#000"};">${review.userId}</span>
                  <div style="display: flex; gap: 2px;">
                    ${Array.from({ length: 5 }).map(() => `<span style="color: #fbbf24; font-size: 18px;">⭐</span>`).join("")}
                  </div>
                </div>
                <p style="color: ${section.textColor || "#000"}; line-height: 1.6;">${review.content}</p>
              </div>
            `).join("") || "";
            
            return `
              <section class="section-reviews" style="background: ${section.backgroundColor || "#ffffff"}; color: ${section.textColor || "#000"}; padding: 80px 40px; width: 860px; margin: 0 auto;">
                <div class="container" style="width: 100%; margin: 0 auto;">
                  ${section.subCopywriter ? `<p style="font-size: 1.1em; margin-bottom: 20px; opacity: 0.8; text-align: center;">${section.subCopywriter}</p>` : ""}
                  ${section.copywriter ? `<h2 style="font-size: 2.5em; font-weight: bold; margin-bottom: 40px; text-align: center;">${section.copywriter}</h2>` : ""}
                  <div style="max-width: 780px; margin: 0 auto;">
                    ${reviewsHTML}
                  </div>
                </div>
              </section>
            `;

          case "cta":
            return `
              <section class="section-cta" style="background: ${section.backgroundColor || "#ffffff"}; color: ${section.textColor || "#000"}; padding: 80px 40px; text-align: center; width: 860px; margin: 0 auto;">
                <div class="container" style="width: 100%; margin: 0 auto;">
                  ${section.subCopywriter ? `<p style="font-size: 1.1em; margin-bottom: 20px; opacity: 0.8;">${section.subCopywriter}</p>` : ""}
                  ${section.copywriter ? `<h2 style="font-size: 2.5em; font-weight: bold; margin-bottom: 40px;">${section.copywriter}</h2>` : ""}
                  ${section.imageConcept && !section.productImage ? `
                    <div style="background: #f5f5f5; border-radius: 15px; padding: 40px; margin-top: 40px; min-height: 400px; display: flex; align-items: center; justify-content: center;">
                      <p style="color: #888; font-style: italic; font-size: 1.1em;">이미지 컨셉: ${section.imageConcept}</p>
                    </div>
                  ` : ""}
                  ${section.productImage ? `<div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;"><img src="${section.productImage}" alt="CTA 이미지" style="max-width: 780px; width: 100%; height: auto; border-radius: 20px; display: block; object-fit: contain; margin: 0 auto;" ${section.productImage.startsWith('data:') ? '' : 'crossorigin="anonymous"'} /></div>` : ""}
                </div>
              </section>
            `;

          default:
            return "";
        }
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${detail.title} - 상세페이지</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 860px;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Noto Sans KR', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #ffffff;
      width: 860px;
      margin: 0 auto;
      padding: 0;
      display: block;
      position: relative;
    }
    section {
      margin-bottom: 0;
      display: block;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    #loading-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      z-index: 10000;
      font-size: 18px;
      display: none;
    }
    #loading-indicator.show {
      display: block;
    }
  </style>
</head>
<body>
  <div id="loading-indicator">이미지 생성 중...</div>
  ${sectionsHTML}
  <script>
    (function() {
      // SVG 플레이스홀더 생성 함수
      function createPlaceholderSVG(text, width, height) {
        const svgContent = '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">' + text + '</text></svg>';
        const encodedSvg = encodeURIComponent(svgContent);
        return 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
      }
      
      // 이미지 로딩 재시도 함수
      function retryImageLoad(img, maxRetries = 3) {
        let retries = 0;
        const originalSrc = img.src;
        
        // 이미 SVG 플레이스홀더인 경우 무시
        if (originalSrc.startsWith('data:image/svg+xml')) {
          return;
        }
        
        function tryLoad() {
          if (retries >= maxRetries) {
            console.error('이미지 로드 최종 실패:', originalSrc);
            // 실패 시 SVG 플레이스홀더로 교체
            const placeholderSVG = createPlaceholderSVG('이미지 로드 실패', 600, 400);
            img.src = placeholderSVG;
            img.alt = '이미지 로드 실패';
            return;
          }
          
          retries++;
          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';
          
          newImg.onload = function() {
            img.src = newImg.src;
            console.log('이미지 로드 성공:', originalSrc);
          };
          
          newImg.onerror = function() {
            console.warn('이미지 로드 실패 (시도 ' + retries + '/' + maxRetries + '):', originalSrc);
            setTimeout(tryLoad, 2000);
          };
          
          newImg.src = originalSrc;
        }
        
        tryLoad();
      }
      
      // 페이지 로드 시 모든 이미지 확인 및 재시도
      function ensureImagesLoaded() {
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
          // 이미 로드된 이미지는 스킵
          if (img.complete && img.naturalWidth > 0) {
            return;
          }
          
          // Base64 이미지가 아닌 경우에만 재시도
          if (!img.src.startsWith('data:')) {
            img.onerror = function() {
              retryImageLoad(img);
            };
            
            // 이미 에러가 발생한 경우 즉시 재시도
            if (!img.complete || img.naturalWidth === 0) {
              retryImageLoad(img);
            }
          }
        });
      }
      
      // html2canvas가 로드될 때까지 대기
      function waitForHtml2Canvas() {
        if (typeof html2canvas !== 'undefined') {
          convertToImage();
        } else {
          setTimeout(waitForHtml2Canvas, 100);
        }
      }

      // 모든 이미지가 로드될 때까지 대기
      function waitForImages(callback) {
        const images = document.querySelectorAll('img');
        let loadedCount = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
          callback();
          return;
        }

        const checkComplete = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            // 추가 대기 시간 (렌더링 완료 대기)
            setTimeout(callback, 1000);
          }
        };

        images.forEach((img) => {
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            checkComplete();
          } else {
            img.onload = checkComplete;
            img.onerror = checkComplete;
          }
        });

        // 타임아웃 설정 (최대 60초)
        setTimeout(() => {
          callback();
        }, 60000);
      }

      // 이미지로 변환하는 함수
      function convertToImage() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.classList.add('show');
        }

        waitForImages(() => {
          const body = document.body;
          
          html2canvas(body, {
            useCORS: true,
            logging: false,
            scale: 2,
            backgroundColor: "#ffffff",
            allowTaint: true,
            foreignObjectRendering: true,
            imageTimeout: 30000,
            width: 860,
            height: Math.min(body.scrollHeight, 5000), // 세로 5000px로 제한
            scrollX: 0,
            scrollY: 0,
          }).then(function(canvas) {
            // 캔버스를 860px 너비로 리사이즈
            const targetWidth = 860;
            const targetHeight = Math.min(canvas.height, 5000); // 세로 5000px로 제한
            
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = targetWidth;
            resizedCanvas.height = targetHeight;
            const ctx = resizedCanvas.getContext('2d');
            
            if (ctx) {
              // 흰색 배경 채우기
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              
              // 원본 이미지를 860px 너비에 맞춰 비율 유지하며 그리기
              const scale = targetWidth / canvas.width;
              const scaledHeight = canvas.height * scale;
              
              if (scaledHeight <= targetHeight) {
                ctx.drawImage(canvas, 0, 0, targetWidth, scaledHeight);
              } else {
                ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);
              }
              
              // 이미지로 다운로드
              resizedCanvas.toBlob(function(blob) {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = \`${safeFileName}_상세페이지.png\`;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  
                  if (loadingIndicator) {
                    loadingIndicator.textContent = '이미지 다운로드 완료!';
                    setTimeout(() => {
                      loadingIndicator.classList.remove('show');
                    }, 2000);
                  }
                }
              }, 'image/png', 1.0);
            }
          }).catch(function(error) {
            console.error('이미지 변환 오류:', error);
            if (loadingIndicator) {
              loadingIndicator.textContent = '이미지 생성 실패';
              setTimeout(() => {
                loadingIndicator.classList.remove('show');
              }, 3000);
            }
          });
        });
      }

      // 페이지 로드 시 먼저 이미지 로딩 확인
      function initializePage() {
        // 먼저 이미지 로딩 확인 및 재시도
        ensureImagesLoaded();
        
        // 이미지 로딩 대기 후 이미지 변환 시작
        setTimeout(function() {
          waitForHtml2Canvas();
        }, 2000); // 2초 대기 후 이미지 변환 시작
      }
      
      // 페이지 로드 완료 후 초기화
      if (document.readyState === 'complete') {
        initializePage();
      } else {
        window.addEventListener('load', initializePage);
      }
    })();
  </script>
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8" suppressHydrationWarning>
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI 상세페이지 도우미</h1>
          <p className="text-gray-600">제품 한 줄만 입력하면 상세페이지를 만들어드립니다</p>
        </div>

        {/* 제품 입력 섹션 */}
        {!generatedDetail && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label htmlFor="product" className="block text-lg font-semibold text-gray-700 mb-3">
                  제품명을 입력해주세요
                </label>
                <input
                  id="product"
                  type="text"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isGenerating) {
                      handleGenerate();
                    }
                  }}
                  placeholder="예: 유기농 아기용 천연 세제 500ml"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !productInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 inline-block mr-2" />
                    상세페이지 생성하기
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* 생성된 상세페이지 프리뷰 */}
        {generatedDetail && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">생성된 상세페이지</h2>
              <div className="flex gap-3 flex-wrap">
                {/* 이미지 다운로드 버튼을 가장 눈에 띄게 배치 - 주요 기능 */}
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloadingImage}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold text-base"
                >
                  {isDownloadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      PNG 이미지 생성 중...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      📸 상세페이지 PNG 이미지 다운로드
                    </>
                  )}
                </button>
                {/* HTML 다운로드 버튼 */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloadingHTML}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingHTML ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      HTML 생성 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      HTML 다운로드
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setGeneratedDetail(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  닫기
                </button>
              </div>
            </div>

                          {/* 배경색 선택 및 이미지 업로드 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">섹션별 설정</h3>
                  <button
                    onClick={() => {
                      setHiddenSections({});
                    }}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Keep All (모두 표시)
                  </button>
                </div>
              <div className="space-y-4">
                {generatedDetail.sections.map((section, idx) => {
                  // 현재 선택된 배경색과 텍스트 색상
                  const currentBgColor = selectedColors[idx] || section.backgroundColor || "#ffffff";
                  const currentTextColor = section.textColor || "#000000";
                  const isHidden = hiddenSections[idx] || false;
                  
                  // 배경색에 따른 텍스트 색상 자동 계산 함수
                  const getTextColor = (bgColor: string) => {
                    // RGB 값을 추출
                    const hex = bgColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    
                    // 밝기 계산 (0~255)
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    
                    // 밝으면 검은색, 어두우면 흰색
                    return brightness > 128 ? '#000000' : '#ffffff';
                  };
                  
                  return (
                    <div key={idx} className={`flex items-center gap-4 flex-wrap ${isHidden ? 'opacity-50' : ''}`}>
                      <div className="w-32 text-sm font-medium">
                        {section.type === "hero" && "히어로"}
                        {section.type === "description" && "설명"}
                        {section.type === "point" && `포인트 ${section.pointNumber || idx + 1}`}
                        {section.type === "summary" && "요약"}
                        {section.type === "reviews" && "후기 및 추천 (Review)"}
                        {section.type === "cta" && "구매행동촉구"}
                      </div>
                      <div className="flex items-center gap-4">
                        {/* 섹션 표시/숨김 토글 */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">표시:</label>
                          <input
                            type="checkbox"
                            checked={!isHidden}
                            onChange={(e) => {
                              setHiddenSections((prev) => ({
                                ...prev,
                                [idx]: !e.target.checked,
                              }));
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            title={isHidden ? "섹션 표시" : "섹션 숨김"}
                          />
                        </div>
                        {/* 배경색 선택 */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">배경색:</label>
                          <div className="relative">
                            <input
                              type="color"
                              value={currentBgColor}
                              onChange={(e) => {
                                const newBgColor = e.target.value;
                                const newTextColor = getTextColor(newBgColor);
                                handleColorChange(idx, { name: "사용자 선택", value: newBgColor, textColor: newTextColor });
                                setGeneratedDetail((prev) => {
                                  if (!prev) return null;
                                  const updatedSections = [...prev.sections];
                                  updatedSections[idx] = {
                                    ...updatedSections[idx],
                                    backgroundColor: newBgColor,
                                    textColor: newTextColor,
                                  };
                                  return { ...prev, sections: updatedSections };
                                });
                              }}
                              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-indigo-500 transition-all"
                              title="배경색 선택"
                            />
                          </div>
                          <div 
                            className="w-8 h-8 rounded border border-gray-300"
                            style={{ backgroundColor: currentBgColor }}
                            title={currentBgColor}
                          />
                        </div>
                        
                        {/* 텍스트 색상 선택 */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">텍스트 색상:</label>
                          <div className="relative">
                            <input
                              type="color"
                              value={currentTextColor}
                              onChange={(e) => {
                                const newTextColor = e.target.value;
                                setGeneratedDetail((prev) => {
                                  if (!prev) return null;
                                  const updatedSections = [...prev.sections];
                                  updatedSections[idx] = {
                                    ...updatedSections[idx],
                                    textColor: newTextColor,
                                  };
                                  return { ...prev, sections: updatedSections };
                                });
                              }}
                              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-indigo-500 transition-all"
                              title="텍스트 색상 선택"
                            />
                          </div>
                          <div 
                            className="w-8 h-8 rounded border border-gray-300"
                            style={{ backgroundColor: currentTextColor }}
                            title={currentTextColor}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 프리뷰 */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden mx-auto" style={{ width: "860px", maxWidth: "100%", margin: "0 auto" }} ref={previewRef}>
              <div className="bg-gray-100 p-4 border-b">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              {/* 이미지 캡처를 위해 스크롤 컨테이너는 previewRef 밖으로 이동 */}
              <div className="bg-white" style={{ height: "5000px", minHeight: "5000px", overflow: "auto", width: "860px", margin: "0 auto" }} id="preview-content">
                {generatedDetail.sections.map((section, idx) => {
                  const isLeft = section.position === "left";
                  const isHidden = hiddenSections[idx] || false;

                  // 숨김 처리된 섹션은 렌더링하지 않음
                  if (isHidden) {
                    return null;
                  }

                  return (
                    <div
                      key={idx}
                      className="p-8 border-b"
                      style={{
                        background: section.backgroundColor || "#ffffff",
                        color: section.textColor || "#000",
                        minHeight: "400px",
                      }}
                    >
                      {section.type === "hero" && (
                        <div className="text-center mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 브랜드명 (작게) */}
                          {generatedDetail.brandName && (
                            <div className="text-gray-500 text-sm mb-4 font-medium tracking-wider">
                              {generatedDetail.brandName}
                            </div>
                          )}
                          {/* 서브타이틀 */}
                          {section.subtitle && (
                            <div className="text-xl mb-6 opacity-80">{section.subtitle}</div>
                          )}
                          {/* 메인 타이틀 (큰글씨, 중앙) */}
                          {section.title && (
                            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{section.title}</h2>
                          )}
                          {/* 설명 */}
                          {section.description && (
                            <p className="text-lg md:text-xl mb-12 whitespace-pre-line mx-auto">{section.description}</p>
                          )}
                          {/* 카피라이터 */}
                          {section.copywriter && (
                            <p className="text-2xl font-semibold mb-12 opacity-90">{section.copywriter}</p>
                          )}
                          {/* 아이콘 표시 (임시) */}
                          <div className="mb-8">
                            <span className="text-4xl">🍦</span>
                          </div>
                          {/* 제품 이미지 */}
                          {section.productImage ? (
                            <div className="mt-12 relative" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                              <img
                                src={section.productImage}
                                alt="제품 이미지"
                                className="rounded-2xl"
                                style={{ 
                                  maxWidth: "780px", 
                                  width: "100%", 
                                  height: "auto", 
                                  display: "block", 
                                  margin: "0 auto",
                                  visibility: "visible",
                                  opacity: "1"
                                }}
                                onLoad={(e) => {
                                  const img = e.currentTarget;
                                  console.log(`이미지 로드 성공 (섹션 ${idx}, ${section.type}):`, img.src.substring(0, 100));
                                  setImageLoadStates(prev => ({
                                    ...prev,
                                    [`${idx}-${section.type}`]: 'loaded'
                                  }));
                                  img.style.display = 'block';
                                  img.style.visibility = 'visible';
                                  img.style.opacity = '1';
                                }}
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const originalSrc = img.src;
                                  if (originalSrc.startsWith('data:image/svg+xml')) {
                                    return;
                                  }
                                  console.error(`이미지 로드 실패 (섹션 ${idx}, ${section.type}):`, originalSrc.substring(0, 100));
                                  setImageLoadStates(prev => ({
                                    ...prev,
                                    [`${idx}-${section.type}`]: 'error'
                                  }));
                                  img.onerror = null;
                                  const placeholderSVG = createPlaceholderSVG("이미지 로드 실패", 600, 400);
                                  img.src = placeholderSVG;
                                }}
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              {imageLoadStates[`${idx}-${section.type}`] === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-2xl">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-12 flex items-center justify-center bg-gray-100 rounded-2xl h-64 mx-auto" style={{ maxWidth: "780px", width: "100%" }}>
                              <div className="text-center">
                                <p className="text-gray-400">이미지 없음</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {section.type === "description" && (
                        <div className="text-center mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 제목 */}
                          {section.title && (
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">{section.title}</h2>
                          )}
                          {/* 카피라이터 */}
                          {section.copywriter && (
                            <p className="text-2xl md:text-3xl font-semibold mb-8 opacity-90">{section.copywriter}</p>
                          )}
                          {/* 설명 텍스트 */}
                          {section.description && (
                            <p className="text-lg md:text-xl mb-12 whitespace-pre-line mx-auto leading-relaxed">{section.description}</p>
                          )}
                          {/* 제품 이미지 (중앙 배치) */}
                          {section.productImage ? (
                            <div className="mt-12 relative" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                              <img
                                src={section.productImage}
                                alt="제품 이미지"
                                className="rounded-2xl"
                                style={{ 
                                  maxWidth: "780px", 
                                  width: "100%", 
                                  height: "auto", 
                                  display: "block", 
                                  margin: "0 auto",
                                  visibility: "visible",
                                  opacity: "1"
                                }}
                                onLoad={(e) => handleImageLoad(e, idx, section.type)}
                                onError={(e) => handleImageError(e, idx, section.type)}
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              {imageLoadStates[`${idx}-${section.type}`] === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-2xl">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-12 flex items-center justify-center bg-gray-100 rounded-2xl h-64 mx-auto" style={{ maxWidth: "780px", width: "100%" }}>
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-400">이미지 준비 중...</p>
                              </div>
                            </div>
                          )}
                          {/* 하단 작은 아이콘+문구들 (제품 관련 문구) */}
                          {(() => {
                            // 제품명에서 키워드 추출
                            const productTitle = generatedDetail?.title || '';
                            const productName = productTitle.toLowerCase();
                            
                            // 제품 카테고리별 문구 생성
                            let phrases: Array<{ icon: string; text: string }> = [];
                            
                            if (productName.includes('가방') || productName.includes('백') || productName.includes('핸드백')) {
                              phrases = [
                                { icon: '💼', text: '업무용으로 완벽' },
                                { icon: '✨', text: '데일리 스타일링' },
                                { icon: '🎁', text: '선물하기 좋은 선택' },
                              ];
                            } else if (productName.includes('신발') || productName.includes('스니커') || productName.includes('운동화')) {
                              phrases = [
                                { icon: '🏃', text: '운동할 때 최적' },
                                { icon: '👟', text: '편안한 착용감' },
                                { icon: '⭐', text: '스타일리시한 디자인' },
                              ];
                            } else if (productName.includes('옷') || productName.includes('의류') || productName.includes('패션')) {
                              phrases = [
                                { icon: '👔', text: '트렌디한 스타일' },
                                { icon: '🌟', text: '어떤 룩에도 완벽' },
                                { icon: '💫', text: '프리미엄 품질' },
                              ];
                            } else if (productName.includes('화장품') || productName.includes('스킨') || productName.includes('크림')) {
                              phrases = [
                                { icon: '💆', text: '피부 관리 필수' },
                                { icon: '✨', text: '자연스러운 효과' },
                                { icon: '🌿', text: '순한 성분으로 안전' },
                              ];
                            } else if (productName.includes('음식') || productName.includes('식품') || productName.includes('간식')) {
                              phrases = [
                                { icon: '🍽️', text: '맛있는 선택' },
                                { icon: '🌱', text: '건강한 원료' },
                                { icon: '⭐', text: '높은 만족도' },
                              ];
                            } else {
                              // 기본 제품 문구
                              phrases = [
                                { icon: '⭐', text: '프리미엄 품질' },
                                { icon: '✨', text: '완벽한 선택' },
                                { icon: '💫', text: '높은 만족도' },
                              ];
                            }
                            
                            return (
                              <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm opacity-70">
                                {phrases.map((phrase, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span>{phrase.icon}</span>
                                    <span>{phrase.text}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {section.type === "point" && (
                        <div className="mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 텍스트 영역 */}
                          <div className="relative mb-8">
                            {/* 포인트 번호 */}
                            {section.pointNumber && (
                              <div className="text-sm font-bold mb-4 opacity-70 tracking-wider">{section.pointNumber}</div>
                            )}
                            {/* 장식 텍스트 (배경용) */}
                            {section.decorativeText && (
                              <div className={`text-7xl font-serif opacity-10 absolute -top-8 ${isLeft ? '-left-8' : '-right-8'} transform ${isLeft ? '-rotate-12' : 'rotate-12'} pointer-events-none z-0`}>
                                {section.decorativeText}
                              </div>
                            )}
                            {/* 제목 */}
                            {section.title && (
                              <h3 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">{section.title}</h3>
                            )}
                            {/* 카피라이터 */}
                            {section.copywriter && (
                              <p className="text-xl md:text-2xl font-semibold mb-6 opacity-90 relative z-10">{section.copywriter}</p>
                            )}
                            {/* 설명 */}
                            {section.description && (
                              <p className="text-lg mb-6 whitespace-pre-line leading-relaxed relative z-10">{section.description}</p>
                            )}
                          </div>
                          {/* 이미지 영역 (아래 배치) */}
                          {section.productImage ? (
                            <div className="relative z-10 mt-8" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                              <img
                                src={section.productImage}
                                alt="제품 이미지"
                                className="rounded-xl"
                                style={{ 
                                  maxWidth: "780px", 
                                  width: "100%", 
                                  height: "auto", 
                                  margin: "0 auto", 
                                  display: "block",
                                  visibility: "visible",
                                  opacity: "1"
                                }}
                                onLoad={(e) => handleImageLoad(e, idx, section.type)}
                                onError={(e) => handleImageError(e, idx, section.type)}
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              {imageLoadStates[`${idx}-${section.type}`] === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-xl">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center bg-gray-100 rounded-xl h-64 relative z-10 mt-8" style={{ maxWidth: "780px", margin: "0 auto" }}>
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-400">이미지 준비 중...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {section.type === "summary" && (
                        <div className="text-center mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 제목 */}
                          {section.title && (
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">{section.title}</h2>
                          )}
                          {/* 카피라이터 */}
                          {section.copywriter && (
                            <p className="text-2xl md:text-3xl font-semibold mb-8 opacity-90">{section.copywriter}</p>
                          )}
                          {/* 설명 */}
                          {section.description && (
                            <p className="text-lg md:text-xl whitespace-pre-line mb-12 leading-relaxed">{section.description}</p>
                          )}
                          {/* 제품 이미지 */}
                          {section.productImage ? (
                            <div className="mt-12 relative" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                              <img
                                src={section.productImage}
                                alt="제품 이미지"
                                className="rounded-2xl"
                                style={{ 
                                  maxWidth: "780px", 
                                  width: "100%", 
                                  height: "auto", 
                                  display: "block", 
                                  margin: "0 auto",
                                  visibility: "visible",
                                  opacity: "1"
                                }}
                                onLoad={(e) => {
                                  const img = e.currentTarget;
                                  console.log(`이미지 로드 성공 (섹션 ${idx}, ${section.type}):`, img.src.substring(0, 100));
                                  setImageLoadStates(prev => ({
                                    ...prev,
                                    [`${idx}-${section.type}`]: 'loaded'
                                  }));
                                  img.style.display = 'block';
                                  img.style.visibility = 'visible';
                                  img.style.opacity = '1';
                                }}
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const originalSrc = img.src;
                                  if (originalSrc.startsWith('data:image/svg+xml')) {
                                    return;
                                  }
                                  console.error(`이미지 로드 실패 (섹션 ${idx}, ${section.type}):`, originalSrc.substring(0, 100));
                                  setImageLoadStates(prev => ({
                                    ...prev,
                                    [`${idx}-${section.type}`]: 'error'
                                  }));
                                  img.onerror = null;
                                  const placeholderSVG = createPlaceholderSVG("이미지 로드 실패", 600, 400);
                                  img.src = placeholderSVG;
                                }}
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              {imageLoadStates[`${idx}-${section.type}`] === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-2xl">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-12 flex items-center justify-center bg-gray-100 rounded-2xl h-64 mx-auto" style={{ maxWidth: "780px", width: "100%" }}>
                              <div className="text-center">
                                <p className="text-gray-400">이미지 없음</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {section.type === "reviews" && (
                        <div className="mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 서브 카피라이터 */}
                          {section.subCopywriter && (
                            <p className="text-lg mb-4 opacity-80 text-center">{section.subCopywriter}</p>
                          )}
                          {/* 메인 카피라이터 (제목) */}
                          {section.copywriter && (
                            <h2 className="text-4xl font-bold mb-12 text-center">{section.copywriter}</h2>
                          )}
                          {/* 후기 리스트 */}
                          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
                            {section.reviews?.map((review, reviewIdx) => (
                              <div key={reviewIdx} className="bg-gray-50 rounded-xl p-6 mb-4">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-semibold">{review.userId}</span>
                                  <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{review.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.type === "cta" && (
                        <div className="text-center mx-auto py-16" style={{ width: "860px", paddingLeft: "40px", paddingRight: "40px" }}>
                          {/* 서브 카피라이터 */}
                          {section.subCopywriter && (
                            <p className="text-lg mb-4 opacity-80">{section.subCopywriter}</p>
                          )}
                          {/* 메인 카피라이터 */}
                          {section.copywriter && (
                            <h2 className="text-4xl font-bold mb-12">{section.copywriter}</h2>
                          )}
                          {/* 이미지 컨셉 또는 제품 이미지 */}
                          {section.imageConcept && !section.productImage && (
                            <div className="bg-gray-100 rounded-2xl p-12 mt-8" style={{ maxWidth: "780px", margin: "0 auto", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <p className="text-gray-500 italic text-lg">이미지 컨셉: {section.imageConcept}</p>
                            </div>
                          )}
                          {section.productImage ? (
                            <div className="mt-8 relative" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                              <img
                                src={section.productImage}
                                alt="CTA 이미지"
                                className="rounded-2xl"
                                style={{ 
                                  maxWidth: "780px", 
                                  width: "100%", 
                                  height: "auto", 
                                  display: "block", 
                                  margin: "0 auto",
                                  visibility: "visible",
                                  opacity: "1"
                                }}
                                onLoad={(e) => handleImageLoad(e, idx, section.type)}
                                onError={(e) => handleImageError(e, idx, section.type)}
                                loading="eager"
                                crossOrigin="anonymous"
                              />
                              {imageLoadStates[`${idx}-${section.type}`] === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-2xl">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : !section.imageConcept && (
                            <div className="mt-8 flex items-center justify-center bg-gray-100 rounded-2xl h-64 mx-auto" style={{ maxWidth: "780px", width: "100%" }}>
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-400">이미지 준비 중...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
