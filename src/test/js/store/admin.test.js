/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test } from '@jest/globals'

import adminStore from 'store/admin'

import lq from 'lq-globals'
jest.mock('lq-globals', () => jest.fn())

describe('admin store', () => {
    test('state.primaryPanel should initially be "lq-workspace-list"', () => {
        // when:
        const result = adminStore.state.primaryPanel

        // then:
        expect(result).toBe('lq-workspace-list')
    })
})