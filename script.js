// API配置
const API_KEY = process.env.API_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

// DOM元素
const chineseNameInput = document.getElementById('chineseName');
const generateBtn = document.getElementById('generateBtn');
const loadingElement = document.getElementById('loading');
const resultsElement = document.getElementById('results');
const customAlertElement = document.getElementById('customAlert');
const alertMessageElement = document.getElementById('alertMessage');
const alertCloseBtn = document.getElementById('alertCloseBtn');

// 生成英文名的提示词
const generatePrompt = (chineseName) => {
    return `作为一名专业的英文名字顾问，请为中文名"${chineseName}"生成3个独特的英文名。
要求：
1. 每个英文名都要体现中国文化特色
2. 每个英文名提供详细的中英文寓意解释
3. 按照以下JSON格式返回：
{
    "names": [
        {
            "english_name": "英文名1",
            "meaning_cn": "中文寓意说明",
            "meaning_en": "英文寓意说明"
        },
        {
            "english_name": "英文名2",
            "meaning_cn": "中文寓意说明",
            "meaning_en": "英文寓意说明"
        },
        {
            "english_name": "英文名3",
            "meaning_cn": "中文寓意说明",
            "meaning_en": "英文寓意说明"
        }
    ]
}`;
};

// 调用API生成英文名
async function generateNames(chineseName) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        "role": "user",
                        "content": generatePrompt(chineseName)
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 0.7,
                top_k: 50,
                frequency_penalty: 0.5,
                response_format: {
                    type: "text"
                }
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        // 检查API响应格式
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('API响应格式不正确');
        }

        const content = data.choices[0].message.content;
        try {
            // 先尝试直接解析
            return JSON.parse(content);
        } catch (parseError) {
            console.error('解析API响应失败:', content);
            
            // 尝试处理markdown格式的JSON (```json ... ```)
            try {
                // 移除markdown标记
                const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                }
                
                // 尝试寻找任何类似JSON对象的结构
                const jsonObject = content.match(/{[\s\S]*}/);
                if (jsonObject) {
                    return JSON.parse(jsonObject[0]);
                }
                
                throw new Error('API响应中找不到有效的JSON');
            } catch (secondError) {
                console.error('二次解析错误:', secondError);
                throw new Error('API响应格式无法解析');
            }
        }
    } catch (error) {
        console.error('生成名字时出错:', error);
        if (error.response) {
            console.error('API响应错误:', await error.response.text());
        }
        throw error;
    }
}

// 显示结果
function displayResults(results) {
    resultsElement.innerHTML = '';
    
    results.names.forEach(name => {
        const nameCard = document.createElement('div');
        nameCard.className = 'name-card';
        nameCard.innerHTML = `
            <h2>${name.english_name}</h2>
            <div class="meaning">
                <p><strong>中文寓意：</strong>${name.meaning_cn}</p>
                <p><strong>English Meaning：</strong>${name.meaning_en}</p>
            </div>
        `;
        resultsElement.appendChild(nameCard);
    });

    resultsElement.style.display = 'block';
}

// 显示自定义弹窗
function showCustomAlert(message) {
    alertMessageElement.textContent = message;
    customAlertElement.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 防止滚动
}

// 关闭自定义弹窗
function closeCustomAlert() {
    customAlertElement.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 添加关闭弹窗事件
alertCloseBtn.addEventListener('click', closeCustomAlert);

// 事件处理
generateBtn.addEventListener('click', async () => {
    const chineseName = chineseNameInput.value.trim();
    
    if (!chineseName) {
        showCustomAlert('请输入您的中文名');
        return;
    }

    // 显示加载动画
    loadingElement.style.display = 'block';
    resultsElement.style.display = 'none';
    generateBtn.disabled = true;

    try {
        const results = await generateNames(chineseName);
        displayResults(results);
    } catch (error) {
        showCustomAlert('生成名字时出错，请稍后重试');
    } finally {
        loadingElement.style.display = 'none';
        generateBtn.disabled = false;
    }
});
