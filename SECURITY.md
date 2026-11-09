# Security policy

Report a vulnerability privately through GitHub's "Report a
vulnerability" button on this repository's Security tab. Please do not
open a public issue for it. You will get a reply within 7 days.

Scope: the code in this repository. It uses the Python standard library
only, calls no API and holds no credentials. The calculator parses
arithmetic with the ast module and never uses eval; a bypass of that
check is in scope. The dashboard in site/ runs the JavaScript port in
the visitor's browser and sends nothing anywhere.
