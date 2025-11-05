import { NextRequest, NextResponse } from "next/server";

// SVG 기반 플레이스홀더 이미지 생성 함수 (서버 사이드용)
function createPlaceholderSVG(text: string, width: number = 600, height: number = 400): string {
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  
  // URL 인코딩하여 data URL로 변환
  const encodedSvg = encodeURIComponent(svgContent);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

// 제품 이미지 생성 함수 (Stability AI 우선 사용, DALL-E 백업)
async function generateProductImage(productName: string, index: number, description?: string): Promise<string> {
  try {
    // Stability AI (Stable Diffusion) 우선 사용 (무료 티어, 빠르고 안정적)
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    console.log(`[이미지 생성 시작] 제품: ${productName}, 섹션: ${index + 1}`);
    console.log(`[환경변수 확인] STABILITY_API_KEY 존재: ${!!stabilityApiKey}, 길이: ${stabilityApiKey?.length || 0}`);
    
    // Stability AI 우선 사용 (무료 티어, 빠르고 안정적)
    if (stabilityApiKey && stabilityApiKey !== "your-api-key-here") {
      try {
        // Stability AI용 이미지 프롬프트 생성 (제품 중심, 매우 구체적)
        const cleanDescription = description ? description.replace(/[^\w\s가-힣]/g, ' ').trim().substring(0, 80) : '';
        
        // 제품명에서 제품 유형 파악 (한글 제품명을 영어로 변환하여 명확하게)
        let productType = productName;
        const productNameMap: Record<string, string> = {
          '오토바이': 'motorcycle',
          '자전거': 'bicycle',
          '자동차': 'car',
          '스마트폰': 'smartphone',
          '노트북': 'laptop',
          '태블릿': 'tablet',
          '카메라': 'camera',
          '시계': 'watch',
          '가방': 'bag',
          '신발': 'shoes',
          '옷': 'clothing',
          '의류': 'clothing',
          '식품': 'food product',
          '음식': 'food',
          '음료': 'drink',
          '커피': 'coffee',
          '차': 'tea',
          '화장품': 'cosmetic product',
          '향수': 'perfume',
          '세제': 'detergent',
          '아기': 'baby product',
          '유아': 'baby product',
        };
        
        for (const [korean, english] of Object.entries(productNameMap)) {
          if (productName.includes(korean)) {
            productType = english;
            break;
          }
        }
        
        // Stability AI용 프롬프트 생성
        const imagePrompt = cleanDescription 
          ? `Professional product photography of a ${productType} called "${productName}". ${cleanDescription}. The exact product "${productName}" (a ${productType}) is the main and only subject in the image, clearly visible, centered, and in sharp focus. Clean white background, studio lighting, commercial photography style. Only the "${productName}" ${productType} in the image, no other objects or unrelated items.`
          : `Professional product photography of a ${productType} called "${productName}". The exact product "${productName}" (a ${productType}) is the main and only subject in the image, clearly visible, centered, and in sharp focus. Clean white background, studio lighting, commercial photography style. Only the "${productName}" ${productType} in the image, no other objects or unrelated items.`;

        console.log(`[Stability AI 이미지 생성 시도] 제품: ${productName}, 프롬프트: ${imagePrompt.substring(0, 150)}`);

        // Stability AI (Stable Diffusion) API 사용
        // FormData 생성 (Node.js 환경)
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('prompt', imagePrompt);
        formData.append('output_format', 'png');
        formData.append('mode', 'generate');
        
        const response = await fetch(
          "https://api.stability.ai/v2beta/stable-image/generate/stable-diffusion-xl-1024-v1-0",
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stabilityApiKey}`,
              'Accept': 'image/*',
              ...formData.getHeaders(),
            },
            body: formData as any,
          }
        );

        console.log(`[Stability AI 응답] 상태: ${response.status}`);
        
        if (response.ok) {
          try {
            const imageBuffer = await response.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const base64DataUrl = `data:image/png;base64,${imageBase64}`;
            console.log(`[Stability AI 성공] Base64 이미지 생성 완료 (길이: ${imageBase64.length})`);
            return base64DataUrl;
          } catch (parseError) {
            console.error(`[Stability AI 파싱 오류]`, parseError);
          }
        } else {
          const errorText = await response.text();
          console.error(`[Stability AI 실패] HTTP ${response.status}`);
          console.error(`[Stability AI 응답 본문]:`, errorText.substring(0, 1000));
        }
      } catch (e) {
        console.error("[Stability AI 오류] 상세:", e);
        if (e instanceof Error) {
          console.error("[Stability AI 오류] 메시지:", e.message);
        }
      }
    } else {
      console.warn(`[Stability AI 건너뜀] API 키가 없거나 설정되지 않음`);
    }

    // Google Imagen 실패 시 DALL-E 사용 (백업)
    const openAiApiKey = process.env.OPENAI_API_KEY;
    console.log(`[환경변수 확인] OPENAI_API_KEY 존재: ${!!openAiApiKey}, 길이: ${openAiApiKey?.length || 0}`);
    
    // DALL-E 백업 사용
    if (openAiApiKey && openAiApiKey !== "your-api-key-here") {
      try {
        // DALL-E용 이미지 프롬프트 생성 (제품 중심, 매우 구체적)
        const cleanDescription = description ? description.replace(/[^\w\s가-힣]/g, ' ').trim().substring(0, 80) : '';
        
        // 제품명에서 제품 유형 파악
        let productType = productName;
        const productNameMap: Record<string, string> = {
          '오토바이': 'motorcycle',
          '자전거': 'bicycle',
          '자동차': 'car',
          '스마트폰': 'smartphone',
          '노트북': 'laptop',
          '태블릿': 'tablet',
          '카메라': 'camera',
          '시계': 'watch',
          '가방': 'bag',
          '신발': 'shoes',
          '옷': 'clothing',
          '의류': 'clothing',
          '식품': 'food product',
          '음식': 'food',
          '음료': 'drink',
          '커피': 'coffee',
          '차': 'tea',
          '화장품': 'cosmetic product',
          '향수': 'perfume',
          '세제': 'detergent',
          '아기': 'baby product',
          '유아': 'baby product',
        };
        
        for (const [korean, english] of Object.entries(productNameMap)) {
          if (productName.includes(korean)) {
            productType = english;
            break;
          }
        }
        
        const imagePrompt = cleanDescription 
          ? `Professional product photography of a ${productType} called "${productName}". ${cleanDescription}. The exact product "${productName}" (a ${productType}) is the main and only subject in the image, clearly visible, centered, and in sharp focus. Clean white background, studio lighting, commercial photography style. Only the "${productName}" ${productType} in the image, no other objects or unrelated items.`
          : `Professional product photography of a ${productType} called "${productName}". The exact product "${productName}" (a ${productType}) is the main and only subject in the image, clearly visible, centered, and in sharp focus. Clean white background, studio lighting, commercial photography style. Only the "${productName}" ${productType} in the image, no other objects or unrelated items.`;

        console.log(`[OpenAI DALL-E 이미지 생성 시도] 제품: ${productName}, 프롬프트: ${imagePrompt.substring(0, 150)}`);

        // OpenAI DALL-E API 사용 (고품질 제품 이미지 생성)
        const response = await fetch(
          "https://api.openai.com/v1/images/generations",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: imagePrompt,
              n: 1,
              size: "1024x1024",
            }),
          }
        );

        const responseText = await response.text();
        console.log(`[DALL-E 응답] 상태: ${response.status}, 응답 길이: ${responseText.length}`);
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            console.log(`[DALL-E 응답 데이터] 키:`, Object.keys(data));
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              if (data.data[0].url) {
                const imageUrl = data.data[0].url;
                console.log(`[OpenAI DALL-E 성공] 이미지 URL 받음: ${imageUrl.substring(0, 50)}...`);
                
                // DALL-E 이미지 URL은 임시 URL이므로 만료되기 전에 Base64로 변환
                try {
                  console.log(`[이미지 다운로드 시작] Base64 변환 시도...`);
                  const imageResponse = await fetch(imageUrl);
                  if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.arrayBuffer();
                    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
                    const base64DataUrl = `data:image/png;base64,${imageBase64}`;
                    console.log(`[이미지 Base64 변환 성공] 길이: ${imageBase64.length}`);
                    return base64DataUrl;
                  } else {
                    console.warn(`[이미지 다운로드 실패] HTTP ${imageResponse.status}, 원본 URL 반환`);
                    return imageUrl;
                  }
                } catch (downloadError) {
                  console.error(`[이미지 다운로드 오류]:`, downloadError);
                  return imageUrl;
                }
              } else {
                console.error(`[DALL-E 오류] 응답에 URL이 없음:`, JSON.stringify(data.data[0]));
              }
            } else {
              console.error(`[DALL-E 오류] 응답 구조 문제:`, JSON.stringify(data));
            }
          } catch (parseError) {
            console.error(`[DALL-E 파싱 오류]`, parseError);
            console.error(`[DALL-E 응답 텍스트]`, responseText.substring(0, 1000));
          }
        } else {
          console.error(`[OpenAI DALL-E 실패] HTTP ${response.status}`);
          console.error(`[DALL-E 응답 본문]:`, responseText.substring(0, 1000));
          
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.error) {
              console.error(`[DALL-E 에러 상세]:`, errorData.error);
            }
          } catch (e) {
            // 파싱 실패는 무시
          }
        }
      } catch (e) {
        console.error("[OpenAI DALL-E 오류] 상세:", e);
        if (e instanceof Error) {
          console.error("[OpenAI DALL-E 오류] 메시지:", e.message);
        }
      }
    } else {
      console.warn(`[DALL-E 건너뜀] API 키가 없거나 설정되지 않음`);
    }

    // Google AI API 및 OpenAI API 실패 시 대안 사용
    // 제품명에서 검색 키워드 추출
    const searchKeywords = extractSearchKeywords(productName, description);
    console.log(`[대안 이미지 검색 시도] 제품: ${productName}, 키워드: ${searchKeywords}, 인덱스: ${index}`);

    // Pexels API 사용 (API 키가 있는 경우)
    try {
      const pexelsApiKey = process.env.PEXELS_API_KEY;
      if (pexelsApiKey && pexelsApiKey !== "your-api-key-here") {
        const searchQuery = encodeURIComponent(searchKeywords);
        
        // Pexels API로 이미지 검색
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=1&orientation=landscape`,
          {
            method: 'GET',
            headers: {
              'Authorization': pexelsApiKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src?.large || data.photos[0].src?.medium;
            if (imageUrl) {
              console.log(`[Pexels 성공] 이미지 URL 받음: ${imageUrl.substring(0, 50)}`);
              return imageUrl;
            }
          }
        } else {
          console.warn(`[Pexels 실패] HTTP ${response.status}`);
        }
      }
    } catch (e) {
      console.warn("[Pexels 오류]", e);
    }


    // Lorem Picsum 제거됨 - Google AI Imagen만 사용

    // Placeholder.com 제거 - 직접 SVG 플레이스홀더 사용
    // 모든 방법이 실패하면 SVG 플레이스홀더 반환 (안정적이고 로드 실패 없음)
    console.warn(`[모든 방법 실패] SVG 플레이스홀더 이미지 사용: ${productName} (섹션 ${index + 1})`);
    return createPlaceholderSVG(`${productName} ${index + 1}`, 600, 400);
  } catch (error) {
    console.error("[이미지 생성 오류]", error);
    
    // 에러 발생 시 SVG 플레이스홀더 반환
    return createPlaceholderSVG(`${productName} ${index + 1}`, 600, 400);
  }
}

// 제품명에서 검색 키워드 추출 함수
function extractSearchKeywords(productName: string, description?: string): string {
  // 제품명에서 주요 키워드 추출
  let keywords = productName;
  
  // 한글 제품명을 영어 키워드로 변환 (간단한 매핑)
  const keywordMap: Record<string, string> = {
    '오토바이': 'motorcycle',
    '자전거': 'bicycle',
    '자동차': 'car',
    '스마트폰': 'smartphone',
    '노트북': 'laptop',
    '태블릿': 'tablet',
    '카메라': 'camera',
    '시계': 'watch',
    '가방': 'bag',
    '신발': 'shoes',
    '옷': 'clothing',
    '의류': 'clothing',
    '식품': 'food',
    '음식': 'food',
    '음료': 'drink',
    '커피': 'coffee',
    '차': 'tea',
    '화장품': 'cosmetic',
    '향수': 'perfume',
    '세제': 'detergent',
    '세안': 'face wash',
    '크림': 'cream',
    '로션': 'lotion',
    '아기': 'baby',
    '유아': 'baby',
    '아이스크림': 'ice cream',
    '책': 'book',
    '노트': 'notebook',
    '펜': 'pen',
    '마우스': 'mouse',
    '키보드': 'keyboard',
    '모니터': 'monitor',
    '스피커': 'speaker',
    '헤드폰': 'headphone',
    '이어폰': 'earphone',
  };

  // 제품명에서 키워드 매핑 시도
  for (const [korean, english] of Object.entries(keywordMap)) {
    if (keywords.includes(korean)) {
      keywords = keywords.replace(korean, english);
      break;
    }
  }

  // 설명이 있으면 추가 키워드 추출
  if (description) {
    const descKeywords = description.split(/\s+/).slice(0, 2).join(' ');
    keywords = `${keywords} ${descKeywords}`;
  }

  // 최종 키워드 정리 (공백 제거, 길이 제한)
  keywords = keywords.trim().substring(0, 100);
  
  // 키워드가 없으면 기본값
  if (!keywords || keywords.length === 0) {
    keywords = 'product';
  }

  return keywords;
}

export async function POST(request: NextRequest) {
  let productName = "";
  let uploadedProductImage: string | null = null;

  try {
    const { product, category, productImage } = await request.json();
    productName = product;
    uploadedProductImage = productImage || null; // 업로드된 제품 이미지

    if (!product || typeof product !== "string") {
      return NextResponse.json(
        { error: "제품명을 입력해주세요." },
        { status: 400 }
      );
    }

    // 환경변수가 설정되지 않은 경우 목 데이터 반환 (이미지 생성도 시도)
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    
    if ((!openAiApiKey || openAiApiKey === "your-api-key-here") && 
        (!googleApiKey || googleApiKey === "your-api-key-here")) {
      // 목 데이터 생성 (이미지 생성은 비동기로 처리되므로 병렬 실행)
      const mockData = await generateMockData(product, category || "food", uploadedProductImage);
      return NextResponse.json(mockData);
    }
    
    const systemPrompt = `당신은 전문적인 제품 상세페이지 작성 전문가입니다. 
사용자가 제공한 제품명 "${productName}"을 중심으로 매력적이고 설득력 있는 상세페이지 내용을 생성해주세요.

**매우 중요 (반드시 준수해야 함)**: 
1. 제품명 "${productName}"을 정확히 이해하고, 해당 제품의 실제 특성만을 다뤄야 합니다.
2. "${productName}"이 무엇인지 정확히 파악하고, 그 제품의 실제 특징, 기능, 장점만을 작성하세요.
3. 제품명과 다른 카테고리나 주제를 혼동하지 마세요. 예를 들어, "${productName}"이 오토바이면 오토바이에 대한 내용만, 음식이면 음식에 대한 내용만 작성하세요.
4. 모든 타이틀, 설명, 카피라이터는 "${productName}" 제품의 실제 특징, 기능, 장점을 구체적으로 강조해야 합니다.
5. 제품명 "${productName}"을 자주 언급하여 제품을 명확하게 식별할 수 있도록 해주세요.
6. 각 섹션의 카피라이터 문구는 반드시 "${productName}" 제품의 실제 특징과 장점을 구체적으로 언급해야 합니다.
7. 일반적인 내용이 아닌 "${productName}" 제품에 특화된 구체적인 내용을 작성해주세요.
8. 카피라이터 문구는 "${productName}" 제품의 핵심 가치와 차별점을 명확하게 전달해야 합니다.
9. 제품명과 관련 없는 다른 주제나 카테고리를 섞지 마세요.
10. 제품명 "${productName}"의 실제 의미와 특성만을 정확히 반영하세요.
반환 형식은 반드시 JSON만 반환해야 하며, 다음 구조를 따라주세요:
{
  "brandName": "브랜드명 (선택사항)",
  "title": "제품명",
  "mainDescription": "제품에 대한 메인 설명 (100-150자)",
  "sections": [
    {
      "type": "hero",
      "title": "메인 타이틀",
      "subtitle": "서브 타이틀",
      "description": "설명",
      "copywriter": "카피라이터 문구",
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "productImage": "AI 생성 이미지 URL (선택사항)"
    },
    {
      "type": "description",
      "title": "제품 설명 타이틀",
      "description": "상세 설명",
      "copywriter": "카피라이터 문구",
      "backgroundColor": "#2a2a2a",
      "textColor": "#ffffff",
      "productImage": "AI 생성 이미지 URL (선택사항)"
    },
    {
      "type": "point",
      "pointNumber": "POINT.01",
      "title": "포인트 제목",
      "description": "포인트 설명",
      "copywriter": "카피라이터 문구",
      "decorativeText": "With friends",
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "productImage": "AI 생성 이미지 URL (선택사항)",
      "position": "left"
    },
    {
      "type": "point",
      "pointNumber": "POINT.02",
      "title": "포인트 제목",
      "description": "포인트 설명",
      "copywriter": "카피라이터 문구",
      "decorativeText": "Best Pick",
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "productImage": "AI 생성 이미지 URL (선택사항)",
      "position": "right"
    },
    {
      "type": "summary",
      "title": "요약 타이틀",
      "description": "요약 설명",
      "copywriter": "카피라이터 문구",
      "backgroundColor": "#fafafa",
      "textColor": "#000000",
      "productImage": "AI 생성 이미지 URL (선택사항)"
    },
    {
      "type": "cta",
      "subCopywriter": "구매행동촉구 CTA 서브 카피라이팅",
      "copywriter": "구매행동촉구 CTA 메인 카피라이팅",
      "imageConcept": "어떤 이미지 넣을지 적기",
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "productImage": "AI 생성 이미지 URL (선택사항)"
    }
  ]
}`;

    const userPrompt = `다음 제품에 대한 상세페이지를 작성해주세요: "${productName}"

**매우 중요한 지침 (반드시 준수):**
1. 제품명 "${productName}"을 정확히 이해하고, 해당 제품의 실제 특성만을 다뤄야 합니다.
2. "${productName}"이 무엇인지 정확히 파악하세요. 오토바이면 오토바이에 대한 내용만, 음식이면 음식에 대한 내용만 작성하세요.
3. 제품명과 다른 카테고리나 주제를 혼동하지 마세요. "${productName}"의 실제 의미와 특성만을 정확히 반영하세요.
4. 모든 내용은 반드시 "${productName}" 제품과 직접적으로 관련되어야 합니다.
5. 제품명 "${productName}"을 자주 언급하여 제품을 명확하게 식별할 수 있도록 해주세요.
6. 각 섹션의 "title", "description", "copywriter"는 "${productName}" 제품의 실제 특징, 기능, 장점을 구체적으로 반영해야 합니다.
7. 카피라이터 문구는 "${productName}" 제품의 핵심 가치와 차별점을 명확하게 전달해야 합니다.
8. 일반적인 내용이 아닌 "${productName}" 제품에 특화된 구체적인 내용을 작성해주세요.
9. 예를 들어, hero 섹션의 copywriter는 "${productName}" 제품의 핵심 가치를, description 섹션의 copywriter는 "${productName}" 제품의 주요 특징을, point 섹션의 copywriter는 "${productName}" 제품의 구체적인 장점을 언급해야 합니다.
10. 모든 섹션의 내용은 "${productName}" 제품을 직접적으로 언급하거나 암시해야 합니다.
11. 제품명과 관련 없는 다른 주제나 카테고리를 섞지 마세요.`;

    let content: string | null = null;
    let errorMessage: string | null = null;

    // OpenAI API를 우선 사용 (키가 있으면)
    if (openAiApiKey && openAiApiKey !== "your-api-key-here") {
      try {
        console.log("[OpenAI API 사용] 텍스트 생성 시도...");
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.7,
              response_format: { type: "json_object" },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[OpenAI API 오류] HTTP ${response.status}: ${errorText}`);
          errorMessage = `OpenAI API 호출 실패: ${response.status}`;
        } else {
          const responseData = await response.json();
          content = responseData.choices?.[0]?.message?.content;
          
          if (content) {
            console.log("[OpenAI API 성공] 텍스트 생성 완료");
          }
        }
      } catch (error) {
        console.error("[OpenAI API 오류]", error);
        errorMessage = `OpenAI API 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
      }
    }

    // OpenAI 실패 시 Google Gemini API 사용 (키가 있으면)
    if (!content && googleApiKey && googleApiKey !== "your-api-key-here") {
      try {
        console.log("[Google Gemini API 사용] 텍스트 생성 시도...");
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt + "\n\n" + userPrompt }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Gemini API 오류] HTTP ${response.status}: ${errorText}`);
          if (!errorMessage) {
            errorMessage = `Gemini API 호출 실패: ${response.status}`;
          }
        } else {
          const responseData = await response.json();
          content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (content) {
            console.log("[Google Gemini API 성공] 텍스트 생성 완료");
          }
        }
      } catch (error) {
        console.error("[Gemini API 오류]", error);
        if (!errorMessage) {
          errorMessage = `Gemini API 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        }
      }
    }

    // 둘 다 실패한 경우 에러 발생
    if (!content) {
      console.error("[텍스트 생성 실패]", errorMessage);
      throw new Error(errorMessage || "AI 응답을 받지 못했습니다.");
    }

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const generatedData = JSON.parse(jsonContent);

    // 제품 이미지 추가 및 지그재그 위치 설정
    if (generatedData.sections) {
      // 모든 이미지를 병렬로 생성 (AI로 생성된 이미지만 사용)
      // 이미지 생성 재시도 함수
      const generateImageWithRetry = async (section: any, index: number, maxRetries: number = 3): Promise<string> => {
        const sectionDescription = (section.description || section.title || section.copywriter || '').trim();
        const imageDescription = sectionDescription 
          ? `${productName} ${sectionDescription}`.substring(0, 120).trim()
          : productName;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`섹션 ${index} (${section.type})에 AI 이미지 생성 시도 ${attempt}/${maxRetries}... 제품: ${productName}`);
            const imageUrl = await generateProductImage(
              productName, 
              index, 
              imageDescription
            );
            
            // Base64 이미지인지 확인 (성공)
            if (imageUrl && imageUrl.startsWith('data:image/')) {
              console.log(`섹션 ${index} (${section.type}) AI 이미지 생성 성공 (시도 ${attempt}):`, imageUrl.substring(0, 100));
              return imageUrl;
            }
            
            // URL인 경우도 성공으로 간주
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log(`섹션 ${index} (${section.type}) AI 이미지 URL 받음 (시도 ${attempt}):`, imageUrl.substring(0, 100));
              return imageUrl;
            }
            
            // SVG 플레이스홀더인 경우 실패로 간주
            if (imageUrl && imageUrl.startsWith('data:image/svg+xml')) {
              console.warn(`섹션 ${index} (${section.type}) SVG 플레이스홀더 반환됨 (시도 ${attempt})`);
              if (attempt < maxRetries) {
                // 재시도 전 대기
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                continue;
              }
            }
            
            console.warn(`섹션 ${index} (${section.type}) 이미지 URL이 유효하지 않음 (시도 ${attempt}):`, imageUrl);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
          } catch (error) {
            console.error(`섹션 ${index} (${section.type}) 이미지 생성 오류 (시도 ${attempt}):`, error);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
          }
        }
        
        // 모든 재시도 실패
        console.error(`섹션 ${index} (${section.type}) 모든 재시도 실패, 플레이스홀더 사용`);
        return createPlaceholderSVG(`${productName} ${section.type}`, 600, 400);
      };

      // DALL-E API Rate Limit을 고려하여 순차적으로 생성
      // 각 이미지 생성 사이에 지연을 두어 Rate Limit 방지
      let successCount = 0;
      let totalCount = 0;
      
      for (let i = 0; i < generatedData.sections.length; i++) {
        const section = generatedData.sections[i];
        const index = i;
        
        // 이미지가 필요한 섹션에 대해 AI로 이미지 생성
        if (section.type === "hero" || section.type === "description" || section.type === "point" || section.type === "summary" || section.type === "cta") {
          totalCount++;
          
          try {
            // 재시도 로직이 포함된 이미지 생성
            const imageUrl = await generateImageWithRetry(section, index, 3);
            section.productImage = imageUrl;
            
            // 성공 확인 (SVG 플레이스홀더가 아닌 경우)
            if (imageUrl && !imageUrl.startsWith('data:image/svg+xml')) {
              successCount++;
              console.log(`✓ 섹션 ${index} (${section.type}) 이미지 생성 성공`);
            } else {
              console.warn(`⚠ 섹션 ${index} (${section.type}) 플레이스홀더 사용`);
            }
            
            // 다음 이미지 생성 전 지연 (Rate Limit 방지)
            if (i < generatedData.sections.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
            }
          } catch (error) {
            console.error(`✗ 섹션 ${index} (${section.type}) 이미지 생성 실패:`, error);
            section.productImage = createPlaceholderSVG(`${productName} ${section.type}`, 600, 400);
          }
        }
        
        // 지그재그 배치를 위한 위치 설정
        if (section.type === "point" && !section.position) {
          section.position = index % 2 === 0 ? "left" : "right";
        }
      }
      
      console.log(`모든 이미지 생성 완료 (성공: ${successCount}/${totalCount})`);
    }

    // 응답 데이터 검증 및 구조화
    // review 섹션 제거
    const filteredSections = Array.isArray(generatedData.sections)
      ? generatedData.sections.filter((section: any) => section.type !== "reviews")
      : [];

    const result = {
      brandName: generatedData.brandName || "",
      title: generatedData.title || product,
      mainDescription: generatedData.mainDescription || "",
      sections: filteredSections,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("상세페이지 생성 오류:", error);

         // 에러 발생 시 목 데이터 반환
     const mockData = await generateMockData(productName || "제품", "food", uploadedProductImage);
     return NextResponse.json(mockData);
   }
 }

// 목 데이터 생성 함수 (API 키가 없을 때 사용)
async function generateMockData(productName: string, category: string, uploadedProductImage?: string | null) {
  // 제품명에 따라 다른 목 데이터 생성
  const isIceCream = /아이스크림|ice.*cream|크림/i.test(productName);
  const isBabyProduct = /아기|유아|아동|베이비|baby/i.test(productName);
  const isFood = category === "food" || /식품|음식|먹거리|food/i.test(productName);

  let sections: any[] = [];

  if (isIceCream) {
    sections = [
      {
        type: "hero",
        title: "여름이니까 이디스크림",
        subtitle: "아이스크림의 혁명",
        description: "생과일을 그대로 담은 아이스크림",
                 copywriter: "시원하게 즐기는 특별한 순간",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 0, "생과일을 그대로 담은 아이스크림"),
       },
       {
         type: "description",
         title: "이디스크림 아이스크림",
         description:
           "시원하고 부드럽게 즐길 수 있는 아이스크림\n이디스크림만의 공법으로 탄생한 잘 녹지 않는 특별한 아이스크림 입니다.",
         copywriter: "특별한 공법의 프리미엄 아이스크림",
         backgroundColor: "#2a2a2a",
         textColor: "#ffffff",
         productImage: await generateProductImage(productName, 1, "시원하고 부드러운 아이스크림"),
       },
       {
         type: "point",
         pointNumber: "POINT.01",
         title: "뜨거운 햇살에도 잘 녹지않는 아이스크림 보셨나요?",
         description:
           "이디스크림만의 특별한 공법으로 더운 여름날 오래오래 녹지않고 드실수 있습니다.",
         copywriter: "녹지 않는 특별함",
         decorativeText: "With friends",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 2, "잘 녹지 않는 특별한 공법의 아이스크림"),
         position: "left",
       },
       {
         type: "point",
         pointNumber: "POINT.02",
         title: "이제 마음 편하게 걸으면서 시원한 아이스크림을 즐기세요!",
         description:
           "특별한 공법으로 만든 이디스크림은 손에 묻지 않고 깔끔하게 즐길 수 있습니다.",
         copywriter: "깔끔하게 즐기는 편안함",
         decorativeText: "Best Pick",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 3, "손에 묻지 않는 깔끔한 아이스크림"),
         position: "right",
       },
       {
         type: "summary",
         title: "뜨거운 햇살에도 잘 녹지않는 아이스크림 보셨나요?",
         description: "이제 마음 편하게 걸으면서 시원한 아이스크림을 즐기세요!",
         copywriter: "완벽한 여름의 선택",
         backgroundColor: "#fafafa",
         textColor: "#000000",
        productImage: await generateProductImage(productName, 4, "여름에 완벽한 아이스크림"),
      },
      {
        type: "cta",
        subCopywriter: "지금 바로 경험해보세요",
                 copywriter: "이제 당신도 특별한 아이스크림을 즐겨보세요!",
         imageConcept: "행복한 여름 일상을 즐기는 사람들의 이미지",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 5, "행복한 여름 일상을 즐기는 사람들"),
       },
    ];
  } else if (isBabyProduct || category === "baby") {
    sections = [
      {
        type: "hero",
        title: productName || "유아용품",
        subtitle: "소중한 우리 아이를 위한",
                 description: "안전하고 건강한 원료로 만든 프리미엄 유아용품",
         copywriter: "아이를 위한 최고의 선택",
         backgroundColor: "#ffffff",
         textColor: "#000000",
        productImage: await generateProductImage(productName, 0, "안전하고 건강한 프리미엄 유아용품"),
       },
       {
         type: "description",
         title: "왜 이 제품인가요?",
         description: "엄마의 마음을 담은 안전한 제품입니다.\n자연 유래 성분만 사용하여 아이 피부에도 안심하고 사용할 수 있습니다.",
         copywriter: "안전과 건강을 동시에",
         backgroundColor: "#dbeafe",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 1, "자연 유래 성분을 사용한 안전한 제품"),
       },
       {
         type: "point",
         pointNumber: "POINT.01",
         title: "100% 천연 원료 사용",
         description: "인공 첨가물 없이 자연 유래 성분만을 사용하여 아이의 건강을 보호합니다.",
         copywriter: "자연이 선사하는 건강",
         decorativeText: "Natural",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 2, "100% 천연 원료를 사용한 제품"),
         position: "left",
       },
       {
         type: "point",
         pointNumber: "POINT.02",
         title: "피부과 전문의 추천",
         description: "민감한 아이 피부도 걱정 없는 저자극 제품입니다.",
         copywriter: "전문가가 인정한 안전성",
         decorativeText: "Safe",
         backgroundColor: "#fef3c7",
         textColor: "#000000",
        productImage: await generateProductImage(productName, 3, "피부과 전문의 추천 저자극 제품"),
        position: "right",
      },
      {
        type: "cta",
        subCopywriter: "우리 아이를 위한 최선의 선택",
                 copywriter: "지금 바로 아이의 건강을 지켜주세요!",
         imageConcept: "행복한 아이와 엄마의 이미지",
         backgroundColor: "#dbeafe",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 4, "행복한 아이와 엄마"),
       },
    ];
  } else {
    // 일반 제품
    sections = [
      {
        type: "hero",
        title: productName || "제품",
        subtitle: "프리미엄 품질",
                 description:
           "고품질의 원료와 정교한 제조 공정을 통해 탄생한 프리미엄 제품입니다.",
         copywriter: "품질이 다른 경험",
         backgroundColor: "#ffffff",
         textColor: "#000000",
        productImage: await generateProductImage(productName, 0, "프리미엄 품질의 제품"),
         position: "left",
       },
       {
         type: "description",
         title: "사용자 중심의 설계",
         description:
           "최신 기술을 접목하여 실용성과 품질을 모두 만족시키는 제품입니다.",
         copywriter: "편리함과 품질의 조화",
         backgroundColor: "#2a2a2a",
         textColor: "#ffffff",
         productImage: await generateProductImage(productName, 1, "사용자 중심의 설계 제품"),
         position: "right",
       },
       {
         type: "point",
         pointNumber: "POINT.01",
         title: "환경 친화적 소재 사용",
         description: "지구 환경을 생각하는 친환경 소재로 제작되었습니다.",
         copywriter: "지구를 생각하는 선택",
         decorativeText: "Eco Friendly",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 2, "환경 친화적 친환경 소재 제품"),
         position: "left",
       },
       {
         type: "point",
         pointNumber: "POINT.02",
         title: "오랜 사용에도 변함없는 품질",
         description:
           "검증된 신뢰성과 우수한 성능으로 오랜 시간 사용해도 품질이 변하지 않습니다.",
         copywriter: "시간을 견디는 품질",
         decorativeText: "Quality",
         backgroundColor: "#fafafa",
         textColor: "#000000",
        productImage: await generateProductImage(productName, 3, "오래 사용해도 변하지 않는 고품질 제품"),
        position: "right",
      },
      {
        type: "cta",
        subCopywriter: "지금 바로 경험해보세요",
                 copywriter: "당신도 프리미엄 품질을 경험해보세요!",
         imageConcept: "제품을 사용하는 만족한 고객의 이미지",
         backgroundColor: "#ffffff",
         textColor: "#000000",
         productImage: await generateProductImage(productName, 4, "제품을 사용하는 만족한 고객"),
       },
    ];
  }

  return {
    brandName: isIceCream ? "ED'CREAM" : isBabyProduct ? "베이비케어" : "",
    title: productName,
    mainDescription: sections[0]?.description || "",
    sections: sections,
  };
}
