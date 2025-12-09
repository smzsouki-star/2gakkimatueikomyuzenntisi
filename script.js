const NUM_QUESTIONS_TO_SHOW = 5; // ランダムに表示する問題数
let selectedQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let quizData = null; // データを格納する変数

document.addEventListener('DOMContentLoaded', () => {
    // プログレス表示を初期化
    updateProgressText();
    
    // 外部のJSONファイルを非同期で読み込む (fetch APIを使用)
    fetch('quiz_data.json')
        .then(response => {
            if (!response.ok) {
                // ファイルが見つからないなどのエラー処理
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            quizData = data; // データをグローバル変数に格納
            
            if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                document.getElementById('quiz-container').innerHTML = '<p>クイズデータの読み込みに失敗しました。</p>';
                return;
            }

            // 全問題からランダムに5問を選択
            const allQuestions = quizData.questions;
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, NUM_QUESTIONS_TO_SHOW);

            // 最初の問題を表示
            renderCurrentQuestion();
        })
        .catch(error => {
            console.error("クイズデータの読み込み中にエラーが発生しました:", error);
            document.getElementById('quiz-container').innerHTML = `
                <p>クイズデータの読み込みに失敗しました。ファイルが全て揃っているか、ブラウザの制限（Live Serverの使用など）を確認してください。</p>
            `;
        });
});

/**
 * 現在の進捗状況を更新して表示します。
 */
function updateProgressText() {
    const progressText = document.getElementById('progress-text');
    if (currentQuestionIndex < NUM_QUESTIONS_TO_SHOW) {
        progressText.textContent = `全${NUM_QUESTIONS_TO_SHOW}問中、${currentQuestionIndex + 1}問目`;
    } else {
        // 全問終了時
        progressText.textContent = `クイズが終了しました！`;
    }
}

/**
 * 現在のインデックスの問題をレンダリングします。
 */
function renderCurrentQuestion() {
    const quizContainer = document.getElementById('quiz-container');
    const q = selectedQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;

    // 正しい答えの解説テキストを取得
    const correctOption = q.answerOptions.find(opt => opt.isCorrect);
    const rationale = correctOption ? correctOption.rationale : '解説が見つかりません。';

    quizContainer.innerHTML = `
        <div class="question-card" id="current-question-card">
            <div class="question-text">Q${questionNumber}. ${q.question}</div>
            <div class="options-container" id="options-${questionNumber}">
                ${q.answerOptions.map((option, optIndex) => `
                    <button 
                        data-option-index="${optIndex}" 
                        onclick="checkAnswer(this, ${optIndex})"
                    >
                        ${option.text}
                    </button>
                `).join('')}
            </div>
            <div class="rationale-text" id="rationale-${questionNumber}">
                <strong>解説:</strong> ${rationale}
            </div>
        </div>
    `;

    document.getElementById('next-question-btn').style.display = 'none';
    updateProgressText();
}

/**
 * 選択肢をクリックしたときに即座に採点とフィードバックを行います。
 * @param {HTMLButtonElement} selectedButton 選択されたボタン要素
 * @param {number} selectedOptionIndex 選択された選択肢のインデックス
 */
function checkAnswer(selectedButton, selectedOptionIndex) {
    // 二重採点を防ぐため、一度採点した問題は再採点しない
    if (document.getElementById('next-question-btn').style.display !== 'none') {
        return;
    }

    const q = selectedQuestions[currentQuestionIndex];
    const isCorrect = q.answerOptions[selectedOptionIndex].isCorrect;
    const optionsContainer = selectedButton.parentNode;
    const questionNumber = currentQuestionIndex + 1;
    
    // 選択したボタンに 'selected' クラスを追加
    selectedButton.classList.add('selected');

    // 全てのボタンを無効化し、正解のフィードバックを表示
    optionsContainer.querySelectorAll('button').forEach((button, oIndex) => {
        button.disabled = true; // ボタンを無効化

        if (q.answerOptions[oIndex].isCorrect) {
            button.classList.add('correct'); // 正解の選択肢を緑色で強調
        }
    });

    if (isCorrect) {
        correctCount++;
    } else {
        // 【⭐ここを修正】不正解の場合、incorrect クラスを追加して赤色表示を有効にする
        selectedButton.classList.add('incorrect');
    }

    // 解説を表示
    document.getElementById(`rationale-${questionNumber}`).style.display = 'block';

    // 「次の問題へ」ボタンを表示
    document.getElementById('next-question-btn').style.display = 'block';
}

/**
 * 次の問題に進むか、クイズを終了します。
 */
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < NUM_QUESTIONS_TO_SHOW) {
        // 次の問題を表示
        renderCurrentQuestion();
    } else {
        // クイズ終了
        showResults();
    }
}

/**
 * クイズ結果を表示します。
 */
function showResults() {
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const scoreText = document.getElementById('score-text');
    const nextBtn = document.getElementById('next-question-btn');

    quizContainer.innerHTML = ''; 
    nextBtn.style.display = 'none';

    scoreText.textContent = `${NUM_QUESTIONS_TO_SHOW}問中、${correctCount}問正解しました！ (${(correctCount / NUM_QUESTIONS_TO_SHOW) * 100}%)`;
    resultsContainer.classList.remove('hidden');

    // 結果コンテナまでスクロール
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}