document.addEventListener('DOMContentLoaded', function () {
    const fileUploadForm = document.getElementById('fileUploadForm');
    const file1Input = document.getElementById('file1');
    const file2Input = document.getElementById('file2');
    const resultDiv = document.getElementById('result');
    const labelFile1 = document.getElementById('labelFile1'); // Dapatkan elemen label
    const labelFile2 = document.getElementById('labelFile2'); // Dapatkan elemen label

    let hasilAnalisisTerakhir = null; // Menyimpan hasil analisis untuk fitur copy

    // Fungsi untuk menampilkan notifikasi yang lebih baik
    function tampilkanNotifikasi(teks, tipe = 'info') {
        // Hapus notifikasi lama jika ada
        const notifLama = document.querySelector('.file-upload-notification');
        if (notifLama) notifLama.remove();
        
        const notif = document.createElement('div');
        notif.textContent = teks;
        notif.classList.add('file-upload-notification', tipe); // Tambah kelas tipe (misal: 'error', 'success')
        document.body.appendChild(notif);

        // Tambahkan CSS untuk animasi
        notif.style.animation = 'slide-in 0.5s forwards';

        // Hilangkan notifikasi setelah 3 detik
        setTimeout(() => {
            notif.style.animation = 'slide-out 0.5s forwards';
            setTimeout(() => notif.remove(), 500);
        }, 3000);
    }

    // Mendengarkan perubahan pada input file dan mengubah label
    file1Input.addEventListener('change', () => {
        if (file1Input.files.length > 0) {
            labelFile1.textContent = `File Terpilih: ${file1Input.files[0].name}`;
            tampilkanNotifikasi("File 1 berhasil diunggah.", 'success');
        } else {
            labelFile1.textContent = 'Upload File yang Lebih Banyak';
        }
    });

    file2Input.addEventListener('change', () => {
        if (file2Input.files.length > 0) {
            labelFile2.textContent = `File Terpilih: ${file2Input.files[0].name}`;
            tampilkanNotifikasi("File 2 berhasil diunggah.", 'success');
        } else {
            labelFile2.textContent = 'Upload File yang Lebih Sedikit';
        }
    });

    // Event handler untuk tombol reset
    const btnReset = document.getElementById('btnReset');
    btnReset.addEventListener('click', () => {
        // Reset form
        fileUploadForm.reset();
        
        // Reset label ke teks awal
        labelFile1.textContent = 'Upload File yang Lebih Banyak';
        labelFile2.textContent = 'Upload File yang Lebih Sedikit';
        
        // Hapus hasil analisis
        resultDiv.innerHTML = '';
        hasilAnalisisTerakhir = null;
        
        // Tampilkan notifikasi
        tampilkanNotifikasi("Form berhasil direset.", 'info');
    });

    // Fungsi util untuk membuat tombol copy
    function buatTombolCopy(teksLabel, tipeData) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-button';
        btn.textContent = teksLabel;
        btn.addEventListener('click', () => {
            if (!hasilAnalisisTerakhir) {
                tampilkanNotifikasi('Belum ada hasil untuk dicopy.', 'error');
                return;
            }
            let targetArray = [];
            if (tipeData === 'duplikat') targetArray = hasilAnalisisTerakhir.duplikatBarcodeFile2;
            if (tipeData === 'tidakAda') targetArray = hasilAnalisisTerakhir.barcodeTidakAdaFile2;

            if (!Array.isArray(targetArray) || targetArray.length === 0) {
                tampilkanNotifikasi('Data kosong, tidak bisa dicopy.', 'error');
                return;
            }

            const objOutput = { "kode_barcode": { "$in": targetArray } };
            const textOutput = JSON.stringify(objOutput, null, 2);

            navigator.clipboard.writeText(textOutput)
                .then(() => tampilkanNotifikasi('Berhasil dicopy ke clipboard.', 'success'))
                .catch(() => tampilkanNotifikasi('Gagal menyalin ke clipboard.', 'error'));
        });
        return btn;
    }

    fileUploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const file1 = file1Input.files[0];
        const file2 = file2Input.files[0];

        if (!file1 || !file2) {
            tampilkanNotifikasi("Harap unggah kedua file.", 'error');
            return;
        }

        // Tampilkan pesan loading
        resultDiv.innerHTML = '<p>Memproses data, mohon tunggu...</p>';

        const reader1 = new FileReader();
        const reader2 = new FileReader();

        reader1.onload = function (event1) {
            try {
                const file1Data = JSON.parse(event1.target.result);
                reader2.onload = function (event2) {
                    try {
                        const file2Data = JSON.parse(event2.target.result);

                        const hasil = cariBarcodeDuplikatDanTidakAda(file1Data, file2Data);
                        hasilAnalisisTerakhir = hasil; // Simpan hasil analisis terakhir untuk fitur copy
                        
                        // Menampilkan hasil yang lebih mudah dibaca
                        renderHasil(hasil);
                        tampilkanNotifikasi("File berhasil diproses!", 'success');
                    } catch (error) {
                        resultDiv.textContent = 'Gagal memproses File 2. Pastikan format file JSON valid.';
                        tampilkanNotifikasi('Kesalahan: File 2 tidak valid.', 'error');
                    }
                };
                reader2.readAsText(file2);
            } catch (error) {
                resultDiv.textContent = 'Gagal memproses File 1. Pastikan format file JSON valid.';
                tampilkanNotifikasi('Kesalahan: File 1 tidak valid.', 'error');
            }
        };
        reader1.readAsText(file1);
    });

    // Fungsi utama pencarian barcode
    function cariBarcodeDuplikatDanTidakAda(file1, file2) {
        const barcodeCounts = {};
        const duplikatBarcodeFile2 = [];
        const barcodeTidakAdaFile2 = [];
    
        // Menggunakan Set untuk performa yang lebih baik dalam mencari barcode unik
        const barcodesFile2 = new Set();
        const barcodesDuplikat = new Set();
    
        for (const obj of file2) {
            // Pastikan obj.kode_barcode ada dan bukan null/undefined
            if (obj && obj.kode_barcode !== undefined && obj.kode_barcode !== null) {
                if (barcodesFile2.has(obj.kode_barcode)) {
                    barcodesDuplikat.add(obj.kode_barcode);
                } else {
                    barcodesFile2.add(obj.kode_barcode);
                }
            }
        }
    
        for (const obj of file1) {
            // Pastikan obj.kode_barcode ada dan bukan null/undefined
            if (obj && obj.kode_barcode !== undefined && obj.kode_barcode !== null && !barcodesFile2.has(obj.kode_barcode)) {
                barcodeTidakAdaFile2.push(obj.kode_barcode);
            }
        }
    
        return { 
            duplikatBarcodeFile2: [...barcodesDuplikat], 
            barcodeTidakAdaFile2 
        };
    }

    // Override bagian display hasil (replace innerHTML block) melalui delegasi setelah analisis
    function renderHasil(hasil) {
        resultDiv.innerHTML = '';
        const h2 = document.createElement('h2');
        h2.textContent = 'Hasil Analisis';
        resultDiv.appendChild(h2);
        resultDiv.appendChild(document.createElement('hr'));

        // Section duplikat
        const h3Dup = document.createElement('h3');
        h3Dup.textContent = `Daftar Barcode Duplikat (${hasil.duplikatBarcodeFile2.length} ditemukan)`;
        resultDiv.appendChild(h3Dup);
        const ulDup = document.createElement('ul');
        ulDup.className = 'result-list';
        if (hasil.duplikatBarcodeFile2.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada barcode duplikat.';
            ulDup.appendChild(li);
        } else {
            hasil.duplikatBarcodeFile2.forEach(b => {
                const li = document.createElement('li');
                li.textContent = b;
                ulDup.appendChild(li);
            });
        }
        resultDiv.appendChild(ulDup);
        resultDiv.appendChild(buatTombolCopy('Copy Duplikat (JSON)', 'duplikat'));

        // Section tidak ada
        const h3Tidak = document.createElement('h3');
        h3Tidak.textContent = `Daftar Barcode Tidak Ada di File 2 (${hasil.barcodeTidakAdaFile2.length} ditemukan)`;
        resultDiv.appendChild(h3Tidak);
        const ulTidak = document.createElement('ul');
        ulTidak.className = 'result-list';
        if (hasil.barcodeTidakAdaFile2.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Semua barcode dari File 1 ada di File 2.';
            ulTidak.appendChild(li);
        } else {
            hasil.barcodeTidakAdaFile2.forEach(b => {
                const li = document.createElement('li');
                li.textContent = b;
                ulTidak.appendChild(li);
            });
        }
        resultDiv.appendChild(ulTidak);
        resultDiv.appendChild(buatTombolCopy('Copy Tidak Ada (JSON)', 'tidakAda'));
        
        // Auto-scroll ke hasil dengan animasi smooth
        setTimeout(() => {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});