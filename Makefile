.PHONY: serve open help

PORT ?= 3333
URL = http://localhost:$(PORT)

help:
	@echo "Baby Smash - Make targets"
	@echo ""
	@echo "  make serve    Start local server (default port 3333)"
	@echo "  make open     Open game in browser (run 'make serve' in another terminal first)"
	@echo "  make          Same as 'make serve'"
	@echo ""
	@echo "  Override port: make serve PORT=8080"

serve:
	npx serve . -p $(PORT)

open:
	@command -v xdg-open >/dev/null 2>&1 && xdg-open $(URL) || \
	 command -v open >/dev/null 2>&1 && open $(URL) || \
	 (start "" "$(URL)" 2>/dev/null || echo "Open $(URL) in your browser")

default: serve
