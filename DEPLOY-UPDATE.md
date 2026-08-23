# Three-Pillar Update 배포

기존 repository와 GitHub Actions workflow는 그대로 둡니다.

1. `research-radar-three-pillar-update.zip`을 다운로드합니다.
2. ZIP을 먼저 압축 해제합니다.
3. GitHub repository `moonmin1/research-radar-pro`의 `Code` 탭으로 이동합니다.
4. `Add file → Upload files`를 누릅니다.
5. 압축 해제한 폴더 자체가 아니라 **내부 파일과 폴더 전체**를 업로드 영역에 끌어놓습니다.
6. `Commit directly to the main branch`를 선택하고 commit합니다.
7. `Actions → Update Research Radar and deploy Pages`에서 새 실행이 초록색으로 끝나는지 확인합니다.
8. 사이트를 새로고침합니다. 이전 화면이 남으면 `Ctrl+Shift+R`로 hard refresh합니다.

업로드 후 repository root에는 `index.html`, `assets/`, `data/`, `scripts/`가 그대로 보여야 합니다. `.github/workflows/update-and-deploy.yml`은 기존 파일을 사용하므로 이번 update package에 포함하지 않았습니다.
