document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        document.getElementById('title').value = tabs[0].title;
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
        const jobData = {
            title: document.getElementById('title').value,
            deadline: document.getElementById('deadline').value,
            priority: document.getElementById('priority').value,
            memo: document.getElementById('memo').value,
            url: null,
            status: 'cart', // 기본 상태
            id: Date.now() // 고유 ID 부여 (정렬/수정용)
        };

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            jobData.url = tabs[0].url;
            chrome.storage.local.get(['jobCart'], (res) => {
                const cart = res.jobCart || [];
                cart.push(jobData);
                chrome.storage.local.set({ jobCart: cart }, () => { alert('저장되었습니다!'); });
            });
        });
    });

    document.getElementById('viewCartBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'list.html' });
    });
});