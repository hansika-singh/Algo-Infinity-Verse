import { buildHtmlTemplate } from '../backend/reports/reportGenerator.js';

describe('reportGenerator - buildHtmlTemplate HTML injection (#2352)', () => {
  it('escapes HTML tags in user.name', () => {
    const html = buildHtmlTemplate(
      {
        name: '<iframe src="http://169.254.169.254/">',
        email: 'user@example.com',
      },
      {}
    );

    expect(html).not.toContain('<iframe src="http://169.254.169.254/">');
    expect(html).toContain('&lt;iframe src=&quot;http://169.254.169.254/&quot;&gt;');
  });

  it('escapes HTML tags in user.email', () => {
    const html = buildHtmlTemplate(
      {
        name: 'Jane Doe',
        email: '<script>fetch("http://169.254.169.254/latest/meta-data/")</script>',
      },
      {}
    );

    expect(html).not.toContain(
      '<script>fetch("http://169.254.169.254/latest/meta-data/")</script>'
    );
    expect(html).toContain(
      '&lt;script&gt;fetch(&quot;http://169.254.169.254/latest/meta-data/&quot;)&lt;/script&gt;'
    );
  });

  it('still renders benign names and emails unescaped-looking', () => {
    const html = buildHtmlTemplate({ name: "O'Brien", email: 'obrien@example.com' }, {});

    expect(html).toContain('O&#39;Brien');
    expect(html).toContain('obrien@example.com');
  });
});
