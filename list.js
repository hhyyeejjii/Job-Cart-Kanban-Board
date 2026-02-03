let currentSort = 'latest';

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupEvents();
});

function setupEvents() {
    // 1. 정렬 버튼 이벤트
    document.querySelectorAll('.btn-sort').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-sort').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.id.replace('sort-', '');
            loadAllData();
        });
    });

    // 2. 제목 & 자유메모 실시간 저장
    document.getElementById('boardTitle').addEventListener('input', (e) => chrome.storage.local.set({ boardTitle: e.target.value }));
    document.getElementById('generalNotes').addEventListener('input', (e) => chrome.storage.local.set({ generalNotes: e.target.value }));

    // 3. 배경 커스텀 이벤트 (복구 완료!)
    const colorPicker = document.getElementById('bgColorPicker');
    const imgInput = document.getElementById('bgImgInput');
    const imgBtn = document.getElementById('bgImgBtn');

    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = color;
        chrome.storage.local.set({ bgColor: color, bgImg: null });
    });

    imgBtn.addEventListener('click', () => imgInput.click());

    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgData = event.target.result;
                document.body.style.backgroundImage = `url(${imgData})`;
                chrome.storage.local.set({ bgImg: imgData });
            };
            reader.readAsDataURL(file);
        }
    });

    // 4. 칸반 드롭 이벤트
    document.querySelectorAll('.column').forEach(col => {
        col.addEventListener('dragover', e => { e.preventDefault();
            col.classList.add('drag-over'); });
        col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
        col.addEventListener('drop', e => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const id = e.dataTransfer.getData("text");
            const newStatus = col.id.replace('col-', '');
            updateStatus(id, newStatus);
        });
    });
}

function loadAllData() {
    chrome.storage.local.get(null, (res) => {
        // 설정값 복구
        if (res.boardTitle) document.getElementById('boardTitle').value = res.boardTitle;
        if (res.generalNotes) document.getElementById('generalNotes').value = res.generalNotes;

        // 배경 복구 (복구 완료!)
        if (res.bgImg) {
            document.body.style.backgroundImage = `url(${res.bgImg})`;
        } else if (res.bgColor) {
            document.body.style.backgroundColor = res.bgColor;
            document.getElementById('bgColorPicker').value = res.bgColor;
        }

        renderBoard(res.jobCart || []);
    });
}

function renderBoard(cart) {
    const sections = { cart: document.getElementById('list-cart'), applied: document.getElementById('list-applied'), finished: document.getElementById('list-finished') };
    Object.values(sections).forEach(s => s.innerHTML = '');

    // 정렬 로직
    if (currentSort === 'deadline') {
        cart.sort((a, b) => (new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31')));
    } else if (currentSort === 'priority') {
        const score = { high: 3, mid: 2, low: 1 };
        cart.sort((a, b) => score[b.priority] - score[a.priority]);
    } else {
        cart.sort((a, b) => b.id - a.id);
    }

    cart.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.addEventListener('dragstart', (e) => e.dataTransfer.setData("text", item.id));

        const badgeText = item.priority === 'high' ? '💖 1순위' : (item.priority === 'mid' ? '👍 2순위' : '🤔 3순위');

        card.innerHTML = `
      <button class="btn-delete">🗑️</button>
      <a href="${item.url}" target="_blank" class="card-title">${item.title}</a>
      <span class="card-date">📅 마감: ${item.deadline || '상시채용'}</span>
      <span class="badge priority-${item.priority}">${badgeText}</span>
      <textarea class="card-memo-edit" placeholder="공고 메모...">${item.memo || ''}</textarea>
    `;

        card.querySelector('.card-memo-edit').addEventListener('input', (e) => updateMemo(item.id, e.target.value));
        card.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id));
        sections[item.status || 'cart'].appendChild(card);
    });

    document.getElementById('cnt-cart').innerText = cart.filter(i => i.status === 'cart').length;
    document.getElementById('cnt-applied').innerText = cart.filter(i => i.status === 'applied').length;
    document.getElementById('cnt-finished').innerText = cart.filter(i => i.status === 'finished').length;
}

function updateMemo(id, newMemo) {
    chrome.storage.local.get(['jobCart'], (res) => {
        const cart = res.jobCart.map(i => i.id == id ? {...i, memo: newMemo } : i);
        chrome.storage.local.set({ jobCart: cart });
    });
}

function updateStatus(id, newStatus) {
    chrome.storage.local.get(['jobCart'], (res) => {
        const cart = res.jobCart.map(i => i.id == id ? {...i, status: newStatus } : i);
        chrome.storage.local.set({ jobCart: cart }, () => loadAllData());
    });
}

function deleteItem(id) {
    if (confirm('삭제할까요?')) {
        chrome.storage.local.get(['jobCart'], (res) => {
            const cart = res.jobCart.filter(i => i.id != id);
            chrome.storage.local.set({ jobCart: cart }, () => loadAllData());
        });
    }
}