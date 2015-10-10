REPORTER = spec


test:
	@NODE_ENV=test ./node_modules/.bin/mocha ./test/ --recursive -b -R $(REPORTER) --require co-mocha

test-cov:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha -- ./test/ --recursive -R $(REPORTER) --require co-mocha


test-coveralls:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	$(MAKE) test
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha --report lcovonly -- ./test/ --recursive -R $(REPORTER) --require co-mocha && \
		cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js || true